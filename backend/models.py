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

class YoutubeChannel(Base):
    __tablename__ = "youtube_channels"

    id = Column(Integer, primary_key=True, index=True)
    nome_app = Column(String(50), nullable=False)       # "aloitech" ou "paranormal"
    nome_canal = Column(String(100), nullable=True)     # Nome do canal (extraído depois)
    youtube_id = Column(String(50), unique=True)        # ID único do canal
    
    # As moedas de ouro do OAuth2 (MUITO CUIDADO COM ELAS EM PROD)
    access_token = Column(String(255), nullable=False)  
    refresh_token = Column(String(255), nullable=True)  
    
    criado_em = Column(DateTime, default=datetime.now)
    atualizado_em = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class DownloadTask(Base):
    __tablename__ = "download_tasks"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String(50), nullable=False, index=True)
    titulo = Column(String(200), nullable=True)
    status = Column(String(20), default="BAIXANDO") # BAIXANDO, CONCLUIDO, ERRO
    arquivo_path = Column(String(255), nullable=True)
    criado_em = Column(DateTime, default=datetime.now)
    atualizado_em = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class AudioTask(Base):
    __tablename__ = "audio_tasks"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String(50), nullable=False, index=True)
    arquivo_path = Column(String(255), nullable=True)
    status = Column(String(20), default="PROCESSANDO") # PROCESSANDO, CONCLUIDO, ERRO
    criado_em = Column(DateTime, default=datetime.now)
    atualizado_em = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class TranscriptionTask(Base):
    __tablename__ = "transcription_tasks"

    id = Column(Integer, primary_key=True, index=True)
    audio_id = Column(Integer, nullable=False, index=True)
    arquivo_path = Column(String(255), nullable=True)
    status = Column(String(20), default="PROCESSANDO") # PROCESSANDO, CONCLUIDO, ERRO
    criado_em = Column(DateTime, default=datetime.now)
    atualizado_em = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class TitleTask(Base):
    __tablename__ = "title_tasks"

    id = Column(Integer, primary_key=True, index=True)
    transcription_id = Column(Integer, nullable=False, index=True)
    sugestoes = Column(Text, nullable=True) # IA Output com os 3 títulos
    status = Column(String(20), default="PROCESSANDO") # PROCESSANDO, CONCLUIDO, ERRO
    criado_em = Column(DateTime, default=datetime.now)
    atualizado_em = Column(DateTime, default=datetime.now, onupdate=datetime.now)