# database.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv() # Carrega as varíaveis do .env

# Montando a URL de conexão do SQLite local
# (O arquivo app_database.db será criado automaticamente na raiz)
SQLALCHEMY_DATABASE_URL = "sqlite:///./data/app_database.db"

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

# Adicione isso no final do arquivo database.py
from models import Base
Base.metadata.create_all(bind=engine)