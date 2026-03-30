# downloader.py
import subprocess
import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from models import DownloadTask
import yt_dlp

router = APIRouter()

# Onde os arquivos vão ser salvos:
DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), "downloads")
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

def executar_ytdlp(task_id: int, video_id: str, db: Session):
    """ Função que o FastAPI vai rodar solto no Background (não trava a chamada HTTP) """
    # Recupera a task para atualizar
    task = db.query(DownloadTask).filter(DownloadTask.id == task_id).first()
    if not task:
        return

    # Usando subprocess para dar call no yt-dlp
    youtube_url = f"https://www.youtube.com/watch?v={video_id}"
    output_path = os.path.join(DOWNLOAD_DIR, f"{video_id}.mp4")
    cookies_path = os.path.join(os.path.dirname(__file__), "secrets", "cookies.txt")
    
    try:
        # Puxa o download! (Demora alguns segundos/minutos)
        print(f"[*] Baixando áudio de: {youtube_url}")
        ydl_opts = {
            'outtmpl': output_path,
            'quiet': True,
            'no_warnings': True,
            'cookies': cookies_path,
            'verbose': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
        print("[+] Download e extração de áudio concluídos.")
        
        task.status = "CONCLUIDO"
        task.arquivo_path = output_path
            
    except Exception as e:
        print(e)
        task.status = "ERRO INTERNO"
    
    db.commit()

@router.post("/baixar-video/{video_id}")
def baixar_video(video_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """ Rota que a UI vai chamar ao clicar no botão 'Baixar' """
    
    # 1. Checa se já baixou pra não duplicar!
    existente = db.query(DownloadTask).filter(DownloadTask.video_id == video_id).first()
    if existente and existente.status in ["BAIXANDO", "CONCLUIDO"]:
        return {"status": existente.status, "mensagem": "Vídeo já foi processado ou está na fila."}
        
    # 2. Registra
    nova_task = DownloadTask(video_id=video_id, titulo=f"Video_{video_id}", status="BAIXANDO")
    db.add(nova_task)
    db.commit()
    db.refresh(nova_task)
    
    # 3. Dispara a tarefa fantasma no loop do FastAPI
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
    """ Rota para a nova tela de Meus Downloads """
    tarefas = db.query(DownloadTask).order_by(DownloadTask.criado_em.desc()).all()
    
    # Conversão rápida pra JSON
    lista = []
    for t in tarefas:
        lista.append({
            "id": t.id,
            "video_id": t.video_id,
            "titulo": t.titulo,
            "status": t.status,
            "arquivo_path": t.arquivo_path,
            "criado_em": t.criado_em.strftime("%Y-%m-%d %H:%M")
        })
    return {"downloads": lista}
