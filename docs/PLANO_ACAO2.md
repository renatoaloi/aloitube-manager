# 📚 Roteiro da Aula (Parte 2): Persistência em SQLite e Consulta de Status

## 🎯 Objetivo
Agora que nossa mecânica de fila e API está fluindo, vamos conectar tudo isso ao mundo real:
1. Gravar a tarefa no banco **SQLite da API** e gerenciar o status.
2. Criar uma rota para o usuário consultar se o arquivo terminou de processar.
3. Trocar aquela "pausa fake" pelo início da integração com a IA local.

*(Observação: Continuamos usando SQLite, ou seja, tudo é criado automaticamente sem precisar de um servidor MySQL local)*

---

## 🗄️ Etapa 8: Modelando a Base de Dados (SQLAlchemy)

Vamos criar a tabela onde registraremos os vídeos recebidos. Crie o arquivo `models.py`.

```python
# models.py
from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base

class VideoTask(Base):
    __tablename__ = "video_tasks"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String(50), nullable=True) # URL ou Arquivo
    status = Column(String(20), default="PENDENTE") # PENDENTE, PROCESSANDO, CONCLUIDO, ERRO
    resultado_json = Column(Text, nullable=True) # IA Output
    criado_em = Column(DateTime, default=datetime.now)
    atualizado_em = Column(DateTime, default=datetime.now, onupdate=datetime.now)
```

No `database.py`, garanta a criação automática no rodapé:
```python
# database.py no finalzinho...
from models import Base
Base.metadata.create_all(bind=engine)
```

---

## 🚦 Etapa 9: Atualizando o Serviço Central (FastAPI)

A API agora cadastra a solicitação no banco antes de notificar o Huey.

```python
# main.py
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import VideoTask # <<< NOVO
from tasks import processar_dados_pesados

app = FastAPI(title="API AI Assistant")

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
```

---

## 🧠 Etapa 10: O Worker Cuidando da Ação Assíncrona

Seu `tasks.py` fica blindado, atualizando a mesma tabela em background:

```python
# tasks.py
import time
from huey import SqliteHuey
from database import SessionLocal
from models import VideoTask

huey = SqliteHuey(filename='huey_queue.db')

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
```

---

## 🔎 Etapa 11: A Rota "Status Polling"

Ninguém quer dar F5 cegamente. Criamos um Endpoint que busca o andamento em tempo real no SQLite:

```python
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
```

> **Simulação da Aula:** Com os dois servidores rodando (Uvicorn e Huey_Consumer), o aluno invoca o POST `iniciar-processamento/123`. Pega o `tracking_id`. Bate imediatamente no GET `/status/{tracking_id}` e vê o status `"PROCESSANDO"`. Dez segundos depois, bate de novo e verá o `"CONCLUÍDO"` com o JSON do resultado! Emulação perfeita de sistemas gigantes, sem gastar 1 centavo com infraestrutura, tudo no localhost!
