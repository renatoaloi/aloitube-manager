# tasks.py
import time
from huey import SqliteHuey
from database import SessionLocal
from models import VideoTask

huey = SqliteHuey(filename='data/huey_queue.db')

@huey.task()
def processar_dados_pesados(db_task_id: int):
    print(f"\n[WORKER] Iniciando tarefa #{db_task_id}...")
    db = SessionLocal()
    
    try:
        tarefa = db.query(VideoTask).filter(VideoTask.id == db_task_id).first()
        if not tarefa:
            return
            
        # 1. MUDA PARA "PROCESSANDO"
        tarefa.status = "PROCESSANDO"
        db.commit()
        
        print(f"[WORKER] Invocando Ollama / Whisper local...")
        
        # ------------------------------------------------------------------- #
        # 2. SEU PROCESSAMENTO PESADO ENTRA AQUI!
        time.sleep(10) # FAKE IA
        resultado_ia = '{"titulos": ["Aprenda Py", "SQLite Fácil", "FastAPI com IA"]}'
        # ------------------------------------------------------------------- #
        
        # 3. CONCLUI COM SUCESSO
        tarefa.status = "CONCLUIDO"
        tarefa.resultado_json = resultado_ia
        db.commit()
        print(f"[WORKER] Tarefa #{db_task_id} Finalizada!")
        
    except Exception as e:
        db.rollback()
        print(f"[WORKER-ERROR] Falha: {str(e)}")
        if tarefa:
            tarefa.status = "ERRO"
            db.commit()
    finally:
        db.close()