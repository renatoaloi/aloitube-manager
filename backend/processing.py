import os
import subprocess
import shutil
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from models import DownloadTask, AudioTask, TranscriptionTask, TitleTask, DescriptionTask, ThumbnailTask
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Configuração de pastas
DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), "downloads")
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "audios")
TRANSCRIPT_DIR = os.path.join(os.path.dirname(__file__), "transcricoes")

if not os.path.exists(AUDIO_DIR):
    os.makedirs(AUDIO_DIR)

if not os.path.exists(TRANSCRIPT_DIR):
    os.makedirs(TRANSCRIPT_DIR)

def executar_transcricao(transcricao_task_id: int, audio_path: str, output_path: str, db: Session):
    """ Função que roda em background para transcrever o áudio usando whisper-cpp """
    transcricao_task = db.query(TranscriptionTask).filter(TranscriptionTask.id == transcricao_task_id).first()
    if not transcricao_task:
        return

    try:
        # Pega caminhos do .env
        whisper_bin = os.getenv("WHISPER_PATH", "whisper-cpp")
        whisper_model = os.getenv("WHISPER_MODEL", "ggml-base.en.bin")

        # Comando whisper-cpp: transcreve áudio em texto
        # -otxt: gera arquivo de texto
        # -of: especifica o nome base da saída (sem extensão)
        command = [
            whisper_bin,
            "-m", whisper_model,
            "-f", audio_path,
            "-l", "pt", # Força português
            "-otxt",
            "-of", output_path  # Note que whisper adiciona .txt automaticamente
        ]
        print(" ".join(command))
        print(f"[*] Iniciando transcrição com: {whisper_bin}")
        result = subprocess.run(command, capture_output=True, text=True)
        
        # O Whisper pode às vezes gerar o arquivo com .wav.txt na pasta de áudio
        # se o flag -of for ignorado ou mal interpretado. 
        # Vamos tratar isso movendo o arquivo para o lugar certo com o nome certo.
        extensao_indevida = audio_path + ".txt"
        destino_final = output_path + ".txt"

        if result.returncode == 0:
            if os.path.exists(extensao_indevida):
                print(f"[*] Movendo arquivo de local indevido: {extensao_indevida} -> {destino_final}")
                shutil.move(extensao_indevida, destino_final)
            
            if os.path.exists(destino_final):
                print(f"[+] Transcrição concluída: {destino_final}")
                transcricao_task.status = "CONCLUIDO"
                transcricao_task.arquivo_path = destino_final
            else:
                print(f"[!] Erro: Arquivo de transcrição não encontrado após o comando.")
                transcricao_task.status = "ERRO"
        else:
            print(f"[!] Erro na transcrição: {result.stderr}")
            transcricao_task.status = "ERRO"
            
    except Exception as e:
        print(f"[!] Erro inesperado na transcrição: {e}")
        transcricao_task.status = "ERRO"
    
    db.commit()

def executar_geracao_titulos(title_task_id: int, transcription_id: int, db: Session):
    """ Função que usa o Ollama para gerar 3 sugestões de títulos virais """
    title_task = db.query(TitleTask).filter(TitleTask.id == title_task_id).first()
    if not title_task:
        return

    try:
        # 1. Busca os detalhes da transcrição
        transc_task = db.query(TranscriptionTask).filter(TranscriptionTask.id == transcription_id).first()
        if not transc_task or not transc_task.arquivo_path:
            raise Exception("Arquivo de transcrição não encontrado.")

        # 2. Lê o conteúdo da transcrição
        with open(transc_task.arquivo_path, "r", encoding="utf-8") as f:
            texto_transcrito = f.read()

        if not texto_transcrito:
            raise Exception("Transcrição vazia.")

        # 3. Integração com Ollama (conforme solicitado pelo usuário no comentário)
        import ollama
        system_msg = "Você é um especialista em SEO para YouTube. Responda APENAS em Português do Brasil. Não inclua apresentações ou comentários iniciais, retorne apenas o conteúdo solicitado."
        prompt = f"Baseado no seguinte texto de um vídeo, crie 3 opções de títulos virais e chamativos para o YouTube. Retorne apenas os 3 títulos numerados.\n\nTexto: {texto_transcrito}"
        
        print(f"[*] Chamando Ollama Llama3.1 para gerar títulos (transcription_id={transcription_id})")
        
        resposta = ollama.chat(
            model='llama3.1', 
            messages=[
                {'role': 'system', 'content': system_msg},
                {'role': 'user', 'content': prompt}
            ]
        )
        
        sugestoes = resposta['message']['content']

        if sugestoes:
            title_task.sugestoes = sugestoes
            title_task.status = "CONCLUIDO"
            print(f"[+] Títulos gerados com sucesso para task #{title_task_id}")
        else:
            raise Exception("Ollama retornou resposta vazia.")

    except Exception as e:
        print(f"[!] Erro ao gerar títulos no Ollama: {e}")
        title_task.status = "ERRO"
        title_task.sugestoes = f"Erro: {str(e)}"
    
    db.commit()

def executar_geracao_descricao(description_task_id: int, transcription_id: int, db: Session):
    """ Função que usa o Ollama para gerar sugestão de descrições SEO e tags """
    description_task = db.query(DescriptionTask).filter(DescriptionTask.id == description_task_id).first()
    if not description_task:
        return

    try:
        # 1. Busca os detalhes da transcrição
        transc_task = db.query(TranscriptionTask).filter(TranscriptionTask.id == transcription_id).first()
        if not transc_task or not transc_task.arquivo_path:
            raise Exception("Arquivo de transcrição não encontrado.")

        # 2. Lê o conteúdo da transcrição
        with open(transc_task.arquivo_path, "r", encoding="utf-8") as f:
            texto_transcrito = f.read()

        if not texto_transcrito:
            raise Exception("Transcrição vazia.")

        # 3. Integração com Ollama
        import ollama
        system_msg = "Você é um especialista em Copywriting para YouTube. Responda APENAS em Português do Brasil. Não inclua apresentações ou comentários iniciais, retorne apenas o conteúdo solicitado."
        prompt = f"Crie uma descrição de 3 parágrafos para o YouTube baseada no seguinte texto. A descrição deve ser envolvente e usar palavras-chave relevantes. Além disso gere as 15 melhores tags (palavras-chave curtas) para um vídeo do YouTube sobre esse assunto. Retorne as tags separadas por vírgula, depois do final da descrição.\n\nTexto: {texto_transcrito}"

        print(f"[*] Chamando Ollama Llama3.1 para gerar descrição (transcription_id={transcription_id})")

        resposta = ollama.chat(
            model='llama3.1', 
            messages=[
                {'role': 'system', 'content': system_msg},
                {'role': 'user', 'content': prompt}
            ]
        )
        
        sugestoes = resposta['message']['content']

        if sugestoes:
            description_task.sugestoes = sugestoes
            description_task.status = "CONCLUIDO"
            print(f"[+] Descrições geradas com sucesso para task #{description_task_id}")
        else:
            raise Exception("Ollama retornou resposta vazia.")

    except Exception as e:
        print(f"[!] Erro ao gerar descrições no Ollama: {e}")
        description_task.status = "ERRO"
        description_task.sugestoes = f"Erro: {str(e)}"
    
    db.commit()

def executar_geracao_thumbnails(thumbnail_task_id: int, transcription_id: int, db: Session):
    """ Função que usa o Ollama para gerar 3 sugestões de thumbnails virais """
    thumbnail_task = db.query(ThumbnailTask).filter(ThumbnailTask.id == thumbnail_task_id).first()
    if not thumbnail_task:
        return

    try:
        # 1. Busca os detalhes da transcrição
        transc_task = db.query(TranscriptionTask).filter(TranscriptionTask.id == transcription_id).first()
        if not transc_task or not transc_task.arquivo_path:
            raise Exception("Arquivo de transcrição não encontrado.")

        # 2. Lê o conteúdo da transcrição
        with open(transc_task.arquivo_path, "r", encoding="utf-8") as f:
            texto_transcrito = f.read()

        if not texto_transcrito:
            raise Exception("Transcrição vazia.")

        # 3. Integração com Ollama
        import ollama
        prompt = f"Baseado no texto a seguir, sugira 3 ideias visuais (prompts) detalhadas para criar a thumbnail (capa) do vídeo do YouTube. Descreva o que deve aparecer na imagem, as cores e a emoção.\n\nTexto: {texto_transcrito}"

        print(f"[*] Chamando Ollama Llama3.1 para gerar thumbnails (transcription_id={transcription_id})")

        resposta = ollama.chat(
            model='llama3.1',
            messages=[
                {'role': 'user', 'content': prompt}
            ]
        )

        sugestoes = resposta['message']['content']

        if sugestoes:
            thumbnail_task.sugestoes = sugestoes
            thumbnail_task.status = "CONCLUIDO"
            print(f"[+] Thumbnails gerados com sucesso para task #{thumbnail_task_id}")
        else:
            raise Exception("Ollama retornou resposta vazia.")

    except Exception as e:
        print(f"[!] Erro ao gerar thumbnails no Ollama: {e}")
        thumbnail_task.status = "ERRO"
        thumbnail_task.sugestoes = f"Erro: {str(e)}"
    
    db.commit()

def executar_extracao(audio_task_id: int, video_path: str, output_path: str, db: Session):
    """ Função que roda em background para extrair o áudio usando ffmpeg """
    audio_task = db.query(AudioTask).filter(AudioTask.id == audio_task_id).first()
    if not audio_task:
        return

    try:
        # Comando ffmpeg: extrai áudio no formato WAV (16kHz, mono, 16-bit)
        # -y sobrescreve se já existir
        command = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vn",
            "-ac", "1",
            "-ar", "16000",
            "-c:a", "pcm_s16le",
            output_path
        ]
        
        print(f"[*] Iniciando extração: {' '.join(command)}")
        result = subprocess.run(command, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"[+] Áudio extraído com sucesso: {output_path}")
            audio_task.status = "CONCLUIDO"
            audio_task.arquivo_path = output_path
        else:
            print(f"[!] Erro no ffmpeg: {result.stderr}")
            audio_task.status = "ERRO"
            
    except Exception as e:
        print(f"[!] Erro inesperado na extração: {e}")
        audio_task.status = "ERRO"
    
    db.commit()

@router.post("/extrair-audio/{video_id}")
def extrair_audio(video_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """ Rota que a UI vai chamar ao clicar no botão 'Extrair Áudio' """
    
    # 1. Busca o vídeo no banco de dados
    video_task = db.query(DownloadTask).filter(DownloadTask.video_id == video_id).first()
    if not video_task or not video_task.arquivo_path:
        raise HTTPException(status_code=404, detail="Vídeo não encontrado ou ainda não baixado.")

    if not os.path.exists(video_task.arquivo_path):
        raise HTTPException(status_code=404, detail="Arquivo de vídeo não encontrado no disco.")

    # 2. Verifica se já existe uma extração para este vídeo
    existente = db.query(AudioTask).filter(AudioTask.video_id == video_id).first()
    if existente and existente.status in ["PROCESSANDO", "CONCLUIDO"]:
        return {"status": existente.status, "mensagem": "Extração já realizada ou em andamento.", "audio_id": existente.id}

    # 3. Prepara o caminho de saída (Whisper exige WAV)
    audio_filename = f"{video_id}.wav"
    audio_path = os.path.join(AUDIO_DIR, audio_filename)

    # 4. Cria a tarefa no banco
    nova_audio_task = AudioTask(video_id=video_id, status="PROCESSANDO")
    db.add(nova_audio_task)
    db.commit()
    db.refresh(nova_audio_task)

    # 5. Dispara a tarefa em background
    background_tasks.add_task(executar_extracao, nova_audio_task.id, video_task.arquivo_path, audio_path, db)

    return {
        "status": "PROCESSANDO",
        "mensagem": "Extração de áudio iniciada em background.",
        "audio_id": nova_audio_task.id
    }

@router.get("/audios")
def listar_audios(db: Session = Depends(get_db)):
    """ Lista todos os áudios já processados """
    audios = db.query(AudioTask).order_by(AudioTask.criado_em.desc()).all()
    return {"audios": audios}

@router.post("/transcrever-audio/{audio_id}")
def transcrever_audio(audio_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """ Rota que a UI vai chamar ao clicar no botão 'Transcrever Áudio' """
    # 1. Busca o audio no banco de dados
    audio_task = db.query(AudioTask).filter(AudioTask.id == audio_id).first()
    if not audio_task or not audio_task.arquivo_path:
        raise HTTPException(status_code=404, detail="Áudio não encontrado ou ainda não extraído.")

    if not os.path.exists(audio_task.arquivo_path):
        raise HTTPException(status_code=404, detail="Arquivo de áudio não encontrado no disco.")

    # 2. Verifica se já existe uma transcrição para este áudio
    existente = db.query(TranscriptionTask).filter(TranscriptionTask.audio_id == audio_id).first()
    if existente and existente.status in ["PROCESSANDO", "CONCLUIDO"]:
        return {"status": existente.status, "mensagem": "Transcrição já realizada ou em andamento.", "transcricao_id": existente.id}

    # 3. Prepara o caminho de saída (SEM .txt pois o whisper adiciona)
    transcricao_path = os.path.join(TRANSCRIPT_DIR, audio_task.video_id)

    # 4. Cria a tarefa no banco
    nova_transcricao_task = TranscriptionTask(audio_id=audio_id, status="PROCESSANDO")
    db.add(nova_transcricao_task)
    db.commit()
    db.refresh(nova_transcricao_task)

    # 5. Dispara a tarefa em background
    background_tasks.add_task(executar_transcricao, nova_transcricao_task.id, audio_task.arquivo_path, transcricao_path, db)

    return {
        "status": "PROCESSANDO",
        "mensagem": "Transcrição iniciada em background.",
        "transcricao_id": nova_transcricao_task.id
    }

@router.get("/transcricoes")
def listar_transcricoes(db: Session = Depends(get_db)):
    """ Lista todas as transcrições orquestradas """
    transcricoes = db.query(TranscriptionTask).order_by(TranscriptionTask.criado_em.desc()).all()
    return {"transcricoes": transcricoes}

@router.get("/transcricao-conteudo/{transcricao_id}")
def obter_transcricao_conteudo(transcricao_id: int, db: Session = Depends(get_db)):
    """ Retorna o conteúdo textual da transcrição """
    task = db.query(TranscriptionTask).filter(TranscriptionTask.id == transcricao_id).first()
    if not task or not task.arquivo_path:
        raise HTTPException(status_code=404, detail="Transcrição não encontrada ou sem arquivo.")
    
    if not os.path.exists(task.arquivo_path):
        raise HTTPException(status_code=404, detail="Arquivo de texto correspondente não encontrado no disco.")
    
    try:
        with open(task.arquivo_path, "r", encoding="utf-8") as f:
            conteudo = f.read()
        return {"conteudo": conteudo}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao ler arquivo: {str(e)}")

@router.post("/gerar-titulos/{transcription_id}")
def gerar_titulos(transcription_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """ Rota que a UI vai chamar ao clicar no ícone de lâmpada 💡 na Central de Transcrições """
    # 1. Busca a tarefa de transcrição
    transc_task = db.query(TranscriptionTask).filter(TranscriptionTask.id == transcription_id).first()
    if not transc_task or transc_task.status != "CONCLUIDO":
        raise HTTPException(status_code=404, detail="Transcrição concluída não encontrada.")

    # 2. Verifica se já existe uma tarefa de geração de títulos
    existente = db.query(TitleTask).filter(TitleTask.transcription_id == transcription_id).first()
    if existente and existente.status in ["PROCESSANDO", "CONCLUIDO"]:
        return {"status": existente.status, "mensagem": "Geração de títulos já realizada ou em andamento.", "title_task_id": existente.id}

    # 3. Cria a tarefa no banco
    nova_title_task = TitleTask(transcription_id=transcription_id, status="PROCESSANDO")
    db.add(nova_title_task)
    db.commit()
    db.refresh(nova_title_task)

    # 4. Dispara a tarefa em background
    background_tasks.add_task(executar_geracao_titulos, nova_title_task.id, transcription_id, db)

    return {
        "status": "PROCESSANDO",
        "mensagem": "Geração de títulos iniciada em background com Ollama.",
        "title_task_id": nova_title_task.id
    }

@router.get("/titulos")
def listar_titulos(db: Session = Depends(get_db)):
    """ Lista todas as tarefas de geração de títulos """
    titulos = db.query(TitleTask).order_by(TitleTask.criado_em.desc()).all()
    return {"titulos": titulos}

@router.get("/titulo-detalhes/{title_task_id}")
def obter_titulo_detalhes(title_task_id: int, db: Session = Depends(get_db)):
    """ Retorna as sugestões geradas pela IA """
    task = db.query(TitleTask).filter(TitleTask.id == title_task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa de título não encontrada.")
    
    return {"sugestoes": task.sugestoes, "status": task.status}

@router.post("/gerar-descricao/{transcription_id}")
def gerar_descricao(transcription_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """ Rota que a UI vai chamar ao clicar no ícone de lâmpada 💡 na Central de Transcrições """
    # 1. Busca a tarefa de transcrição
    transc_task = db.query(TranscriptionTask).filter(TranscriptionTask.id == transcription_id).first()
    if not transc_task or transc_task.status != "CONCLUIDO":
        raise HTTPException(status_code=404, detail="Transcrição concluída não encontrada.")

    # 2. Verifica se já existe uma tarefa de geração de descrição
    existente = db.query(DescriptionTask).filter(DescriptionTask.transcription_id == transcription_id).first()
    if existente and existente.status in ["PROCESSANDO", "CONCLUIDO"]:
        return {"status": existente.status, "mensagem": "Geração de descrição já realizada ou em andamento.", "description_task_id": existente.id}

    # 3. Cria a tarefa no banco
    nova_descricao_task = DescriptionTask(transcription_id=transcription_id, status="PROCESSANDO")
    db.add(nova_descricao_task)
    db.commit()
    db.refresh(nova_descricao_task)

    # 4. Dispara a tarefa em background
    background_tasks.add_task(executar_geracao_descricao, nova_descricao_task.id, transcription_id, db)

    return {
        "status": "PROCESSANDO",
        "mensagem": "Geração de descrição iniciada em background com Ollama.",
        "description_task_id": nova_descricao_task.id
    }

@router.get("/descricoes")
def listar_descricoes(db: Session = Depends(get_db)):
    """ Lista todas as tarefas de geração de títulos """
    descricoes = db.query(DescriptionTask).order_by(DescriptionTask.criado_em.desc()).all()
    return {"descricoes": descricoes}

@router.get("/descricao-detalhes/{description_task_id}")
def obter_descricao_detalhes(description_task_id: int, db: Session = Depends(get_db)):
    """ Retorna as sugestões geradas pela IA """
    task = db.query(DescriptionTask).filter(DescriptionTask.id == description_task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa de descrição não encontrada.")
    
    return {"sugestoes": task.sugestoes, "status": task.status}

@router.post("/gerar-thumbnails/{transcription_id}")
def gerar_thumbnails(transcription_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """ Rota que a UI vai chamar ao clicar no ícone de lâmpada 💡 na Central de Transcrições """
    # 1. Busca a tarefa de transcrição
    transc_task = db.query(TranscriptionTask).filter(TranscriptionTask.id == transcription_id).first()
    if not transc_task or transc_task.status != "CONCLUIDO":
        raise HTTPException(status_code=404, detail="Transcrição concluída não encontrada.")

    # 2. Verifica se já existe uma tarefa de geração de thumbnails
    existente = db.query(ThumbnailTask).filter(ThumbnailTask.transcription_id == transcription_id).first()
    if existente and existente.status in ["PROCESSANDO", "CONCLUIDO"]:
        return {"status": existente.status, "mensagem": "Geração de thumbnails já realizada ou em andamento.", "thumbnail_task_id": existente.id}

    # 3. Cria a tarefa no banco
    nova_thumbnail_task = ThumbnailTask(transcription_id=transcription_id, status="PROCESSANDO")
    db.add(nova_thumbnail_task)
    db.commit()
    db.refresh(nova_thumbnail_task)

    # 4. Dispara a tarefa em background
    background_tasks.add_task(executar_geracao_thumbnails, nova_thumbnail_task.id, transcription_id, db)

    return {
        "status": "PROCESSANDO",
        "mensagem": "Geração de thumbnails iniciada em background com Ollama.",
        "thumbnail_task_id": nova_thumbnail_task.id
    }

@router.get("/thumbnails")
def listar_thumbnails(db: Session = Depends(get_db)):
    """ Lista todas as tarefas de geração de thumbnails """
    thumbnails = db.query(ThumbnailTask).order_by(ThumbnailTask.criado_em.desc()).all()
    return {"thumbnails": thumbnails}

@router.get("/thumbnail-detalhes/{thumbnail_task_id}")
def obter_thumbnail_detalhes(thumbnail_task_id: int, db: Session = Depends(get_db)):
    """ Retorna as sugestões geradas pela IA """
    task = db.query(ThumbnailTask).filter(ThumbnailTask.id == thumbnail_task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa de thumbnail não encontrada.")
    
    return {"sugestoes": task.sugestoes, "status": task.status}