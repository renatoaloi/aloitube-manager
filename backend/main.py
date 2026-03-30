from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
from models import VideoTask # <<< NOVO
from tasks import processar_dados_pesados
from auth import router as auth_router
from youtube_api import router as youtube_router
from downloader import router as downloader_router
from processing import router as processing_router

app = FastAPI(title="API AI Assistant")

# Resolvendo o erro de Network Error (CORS) do Axios/React!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Na produção, coloque a URL exata do seu Vite (ex: http://localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(youtube_router)
app.include_router(downloader_router)
app.include_router(processing_router)

@app.post("/iniciar-processamento/{video_id}")
def iniciar_processamento(video_id: str, db: Session = Depends(get_db)):
    
    # 1. CRIAR REGISTRO NO BANCO DE DADOS (SQLite - app_database.db)
    nova_tarefa = VideoTask(video_id=video_id, status="PENDENTE")
    db.add(nova_tarefa)
    db.commit()
    db.refresh(nova_tarefa)  # Recuperamos o ID gerado (O SQLite cuida do Auto-Increment)
    
    # 2. ENVIAR PARA A FILA HUEY (Usando o ID do BD)
    processar_dados_pesados(nova_tarefa.id)
    
    # 3. RETORNAR IMEDIATO PARA O USUÁRIO
    return {
        "mensagem": "O vídeo entrou na fila pesada de análise da IA!",
        "tracking_id": nova_tarefa.id
    }

# main.py (Final do arquivo)
@app.get("/status/{tracking_id}")
def ver_status(tracking_id: int, db: Session = Depends(get_db)):
    tarefa = db.query(VideoTask).filter(VideoTask.id == tracking_id).first()
    
    if not tarefa:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
        
    if tarefa.status == "CONCLUIDO":
        return {
            "status": "CONCLUIDO",
            "resultado_ia": tarefa.resultado_json
        }
        
    return {
        "status": tarefa.status,
        "detalhe": "AI Loading..."
    }