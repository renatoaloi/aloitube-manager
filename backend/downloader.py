# downloader.py
import subprocess
import sys
import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from pydantic import BaseModel
from models import DownloadTask, VideoMetadata

# Garante que o Node.js (necessário para resolver JS challenges do YouTube)
# esteja no PATH, mesmo quando rodando dentro de um venv ou subprocesso FastAPI.
_NODE_PATH = r"C:\Program Files\nodejs"
if _NODE_PATH not in os.environ.get("PATH", ""):
    os.environ["PATH"] = _NODE_PATH + os.pathsep + os.environ.get("PATH", "")

router = APIRouter()

class VideoMetadataRequest(BaseModel):
    titulo: str
    thumb: str
    data_publicacao: str

# Onde os arquivos vão ser salvos:
DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), "downloads")
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

def executar_ytdlp(task_id: int, video_id: str, db: Session):
    """
    Executa o download via subprocess (yt-dlp CLI).

    Motivo: A API Python do yt_dlp tem um bug onde o yt_dlp_ejs cacheia
    a disponibilidade dos JS runtimes no início da sessão, fazendo com que
    o Node.js fique sempre como 'unavailable'. Usar subprocess garante um
    processo limpo que detecta e usa o Node.js corretamente para resolver
    o n-challenge do YouTube.
    """
    task = db.query(DownloadTask).filter(DownloadTask.id == task_id).first()
    if not task:
        return

    youtube_url = f"https://www.youtube.com/watch?v={video_id}"
    output_template = os.path.join(DOWNLOAD_DIR, f"{video_id}.%(ext)s")
    final_path = os.path.join(DOWNLOAD_DIR, f"{video_id}.mp4")
    cookies_path = os.path.join(os.path.dirname(__file__), "secrets", "cookies.txt")

    try:
        print(f"[*] Baixando vídeo: {youtube_url}")

        cmd = [
            sys.executable, "-m", "yt_dlp",
            "--js-runtimes", "node",
            "--format", "bestvideo+bestaudio/best",
            "--merge-output-format", "mp4",
            "--output", output_template,
        ]

        if os.path.exists(cookies_path):
            cmd += ["--cookies", cookies_path]

        cmd.append(youtube_url)

        result = subprocess.run(cmd, capture_output=False)

        if result.returncode != 0:
            print(f"[!] yt-dlp retornou exit code {result.returncode}")
            task.status = "ERRO INTERNO"
            db.commit()
            return

        # Detecta o arquivo gerado (pode ter extensão diferente de .mp4 em edge cases)
        if not os.path.exists(final_path):
            for ext in [".mkv", ".webm", ".mp4"]:
                candidate = os.path.join(DOWNLOAD_DIR, f"{video_id}{ext}")
                if os.path.exists(candidate):
                    final_path = candidate
                    break

        print(f"[+] Download concluído: {final_path}")
        task.status = "CONCLUIDO"
        task.arquivo_path = final_path

    except Exception as e:
        print(f"[!] Erro no download: {e}")
        task.status = "ERRO INTERNO"

    db.commit()


@router.post("/baixar-video/{video_id}")
def baixar_video(video_id: str, metadata: VideoMetadataRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """ Rota que a UI vai chamar ao clicar no botão 'Baixar' """
    
    # 1. Salva ou atualiza os metadados do vídeo primeiro
    meta = db.query(VideoMetadata).filter(VideoMetadata.video_id == video_id).first()
    if not meta:
        meta = VideoMetadata(
            video_id=video_id,
            titulo=metadata.titulo,
            thumb=metadata.thumb,
            data_publicacao=metadata.data_publicacao
        )
        db.add(meta)
    else:
        # Atualiza caso tenha mudado algo (opcional)
        meta.titulo = metadata.titulo
        meta.thumb = metadata.thumb
        meta.data_publicacao = metadata.data_publicacao
    
    # 2. Checa se já baixou pra não duplicar!
    existente = db.query(DownloadTask).filter(DownloadTask.video_id == video_id).first()
    if existente and existente.status in ["BAIXANDO", "CONCLUIDO"]:
        return {"status": existente.status, "mensagem": "Vídeo já foi processado ou está na fila."}
        
    # 3. Registra a task de download
    nova_task = DownloadTask(video_id=video_id, titulo=metadata.titulo, status="BAIXANDO")
    db.add(nova_task)
    db.commit()
    db.refresh(nova_task)
    
    # 4. Dispara a tarefa fantasma no loop do FastAPI
    background_tasks.add_task(executar_ytdlp, nova_task.id, video_id, db)
    
    return {"status": "iniciado", "mensagem": "Baixa de arquivo executando em background."}

@router.post("/tentar-novamente/{task_id}")
def tentar_novamente(task_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """ Tenta baixar novamente um vídeo que deu erro """
    task = db.query(DownloadTask).filter(DownloadTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
        
    if task.status in ["BAIXANDO", "CONCLUIDO"]:
        return {"status": task.status, "mensagem": "O status atual não permite tentar novamente."}
        
    # Reseta o status e tenta denovo
    task.status = "BAIXANDO"
    db.commit()
    
    background_tasks.add_task(executar_ytdlp, task.id, task.video_id, db)
    return {"status": "reiniciado", "mensagem": "Tentativa de download reiniciada."}

@router.get("/downloads")
def listar_downloads(db: Session = Depends(get_db)):
    """ Rota para a nova tela de Meus Downloads com JOIN para pegar metadados """
    tarefas = db.query(DownloadTask, VideoMetadata).outerjoin(
        VideoMetadata, DownloadTask.video_id == VideoMetadata.video_id
    ).order_by(DownloadTask.criado_em.desc()).all()
    
    lista = []
    for t, m in tarefas:
        lista.append({
            "id": t.id,
            "video_id": t.video_id,
            "titulo": m.titulo if m else t.titulo, # Fallback pro título da task se não tiver meta
            "thumb": m.thumb if m else None,
            "status": t.status,
            "arquivo_path": t.arquivo_path,
            "criado_em": t.criado_em.strftime("%Y-%m-%d %H:%M")
        })
    return {"downloads": lista}
