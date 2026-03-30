# youtube_api.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from database import get_db
from models import YoutubeChannel

router = APIRouter()

@router.get("/videos/{app_name}")
def listar_meus_videos(app_name: str, db: Session = Depends(get_db)):
    # 1. Busca os tokens do app específico autenticado lá atrás via OAuth
    canal = db.query(YoutubeChannel).filter(YoutubeChannel.nome_app == app_name).first()
    if not canal:
        raise HTTPException(status_code=401, detail="Por favor, faça login com o Google primeiro!")
        
    # 2. Recriar o objeto de Credenciais da biblioteca do Google
    creds = Credentials(
        token=canal.access_token,
        refresh_token=canal.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id="", # A biblioteca às vezes precisa, mas como a gente só lê os vídeos, costuma passar. 
                      # Se tiver expirado, vai precisar do client_id/secret pra usar o refresh token. 
                      # Mas para a aula, vamos assumir token fresco ou ignorar expiração automática por enquanto (senão complica a didática).
        client_secret=""
    )
    
    # 3. Criar a "instância" da API do YouTube
    try:
        youtube = build("youtube", "v3", credentials=creds)
        
        # 4. Chamar o serviço para listar os vídeos do próprio canal (forMine=True)
        request = youtube.search().list(
            part="snippet",
            forMine=True,
            type="video",
            maxResults=10,
            order="date" # Os mais recentes primeiro
        )
        response = request.execute()
        
        # 5. Transformar os dados bagunçados do Google no nosso formato "fakeVideos" mas com dados reais!
        videos_reais = []
        for item in response.get("items", []):
            vid_id = item["id"]["videoId"]
            # Para popular views e comentarios precisamos de uma SEGUNDA chamada à API (videos.list)
            # Mas para não complicar, apenas retornamos dados básicos do `search` por enquanto ou fazemos uma batch call.
            
            # Vamos fazer o mapeamento limpo
            videos_reais.append({
                "id": vid_id,
                "titulo": item["snippet"]["title"],
                "resumo": item["snippet"]["description"] or "Sem descrição.",
                "ia_status": "Pendente", # Pode vir de um JOIN do banco na vida real
                "visibilidade": "Desconhecido", # 'search' não retorna status de visibilidade
                "data": item["snippet"]["publishedAt"][:10],
                "views": "-",
                "comentarios": "-",
                "thumb": item["snippet"]["thumbnails"]["medium"]["url"]
            })
            
        return {"videos": videos_reais}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
