# 📚 Roteiro da Aula: Mensageria Local com Huey + API FastAPI (Tudo em SQLite!)

## 🎯 Objetivo
Aprender a configurar um sistema de background jobs (filas de tarefas) leve e robusto para rodar localmente no Windows. Vamos utilizar o **Huey** (consumindo um banco SQLite local para a fila) integrado a uma API **FastAPI** que lê/grava dados no banco principal (que agora também será **SQLite** para facilitar o desenvolvimento local sem precisar de dependências externas).

---

## 🛠️ Etapa 1: Preparando o Terreno (Ambiente e Dependências)

### 1.1. Criando o Ambiente Virtual
Sempre isole seu projeto para não misturar dependências.
```bash
python -m venv venv
venv\Scripts\activate  # No Windows
```

### 1.2. Instalando as Bibliotecas Necessárias
```bash
pip install fastapi uvicorn huey sqlalchemy python-dotenv
```
*Detalhando o que instalamos:*
- **fastapi / uvicorn**: Para construir e rodar nossa API.
- **huey**: Nosso gerenciador de filas/mensageria leve.
- **sqlalchemy**: Para conectar a API ao nosso banco de dados principal (SQLite).
- **python-dotenv**: Para gerenciar configurações (variáveis de ambiente).

---

## 📁 Etapa 2: Estrutura do Projeto

Vamos organizar nosso código de forma limpa (*Clean Architecture* básica). Crie na raiz do projeto:

```text
/meu_projeto
│
├── .env                 # Configurações do ambiente
├── database.py          # Conexão com o Banco Principal (SQLite)
├── tasks.py             # Configuração do Huey (SQLite) e rotinas em background
├── main.py              # Nossa API FastAPI
└── requirements.txt     # (Opcional) pip freeze > requirements.txt
```

---

## ⚙️ Etapa 3: Arquivo de Configuração (.env)

Crie o arquivo `.env` na raiz do projeto. Embora não estejamos usando o MySQL, num projeto real você colocaria chaves de API do ChatGPT/Ollama aqui.

```env
# .env
MODELO_IA=ollama-llama3
```

---

## 🗄️ Etapa 4: Conectando a API ao Banco Principal (SQLite)

No arquivo `database.py`, vamos configurar o SQLAlchemy para bater no nosso banco de dados da aplicação (`app_database.db`).

```python
# database.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv() # Carrega as varíaveis do .env

# Montando a URL de conexão do SQLite local
# (O arquivo app_database.db será criado automaticamente na raiz)
SQLALCHEMY_DATABASE_URL = "sqlite:///./app_database.db"

# Usamos check_same_thread=False porque FastAPI pode abrir a mesma sessão em várias threads
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependência do FastAPI para injetar a sessão
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## 🚀 Etapa 5: Configurando o Huey e Criando Tarefas 

Aqui a mágica acontece. O arquivo `tasks.py` será o "motor" das nossas tarefas em background. O Huey vai criar outro arquivo local, `.db` isolado, apenas para gerenciar a FILA.

```python
# tasks.py
from huey import SqliteHuey
import time
from database import SessionLocal

# Configuração do Broker: Usaremos o SQLite para rodar 100% liso no Windows
# Ele vai criar um arquivo "huey_queue.db" automaticamente na raiz do projeto
huey = SqliteHuey(filename='huey_queue.db')

@huey.task()
def processar_dados_pesados(item_id: int):
    """
    Exemplo de tarefa que roda em background.
    Aqui simulamos um processo lento (ex: gerando títulos com IA via Ollama, transcrição de áudio, etc).
    """
    print(f"[START] Processando item {item_id}...")
    
    # Exemplo: Abrindo conexão com o banco SQLite principal DENTRO da task
    db = SessionLocal()
    try:
        # Simulando demora
        time.sleep(5) 
        print(f"[PROGRESS] Dados do banco SQLite poderiam estar sendo lidos ou gravados aqui.")
        
        # Em um caso real, você faria um UPDATE na tabela usando o ID, 
        # mudando o status de "Processando" para "Concluído".
        print(f"[END] Item {item_id} processado com sucesso!")
        
    except Exception as e:
        print(f"[ERROR] Falha ao processar o item {item_id}: {str(e)}")
    finally:
        db.close()
```

---

## 🌐 Etapa 6: Integrando Tudo na API (FastAPI)

No `main.py`, vamos receber a requisição (ex: o usuário quer processar um vídeo) e "jogar" o trabalho para o Huey.

```python
# main.py
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import get_db
from tasks import processar_dados_pesados

app = FastAPI(title="Minha API com Mensageria Local")

@app.post("/iniciar-processamento/{item_id}")
def iniciar_processamento(item_id: int, db: Session = Depends(get_db)):
    """
    Endpoint que recebe a ação do usuário, anota e manda pra fila (Huey). 
    Responde imediatamente.
    """
    # 1. Valide os dados ou salve/leia o SQLite principal através de 'db'
    
    # 2. Despachar a tarefa pesada para o background (aqui basta chamar a função normalmente!)
    tarefa = processar_dados_pesados(item_id)
    
    # 3. Retornar na hora para o usuário não ficar esperando a tela carregar
    return {
        "status": "Processamento enviado para a fila!",
        "item": item_id,
        "job_id": tarefa.id
    }
```

---

## 🏁 Etapa 7: Como Testar e Rodar (O Pulo do Gato)

Sistemas com mensageria exigem **dois** terminais abrindo instâncias separadas.

**Terminal 1: Rodando a API FastAPI**
```bash
venv\Scripts\activate
uvicorn main:app --reload
```

**Terminal 2: Rodando o Worker/Consumer do Huey**
```bash
venv\Scripts\activate
huey_consumer tasks.huey
```

> 💡 **Como saber se funcionou?** Acesse `http://127.0.0.1:8000/docs`, dispare o POST, e olhe o worker no Terminal 2 pegar as mensagens e processá-las!
