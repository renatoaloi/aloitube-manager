# youtube_api.py
import pprint

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from database import get_db
from models import YoutubeChannel

router = APIRouter()

def get_video_details(api_key, video_id):
    """Fetches and prints details for a given YouTube video ID."""
    try:
        # Build the YouTube API service object
        youtube = build('youtube', 'v3', credentials=api_key)

        # Make a request to the videos().list() method
        request = youtube.videos().list(
            part="snippet,contentDetails,statistics,status", # Specify the parts you need
            id=video_id
        )

        # Execute the request
        response = request.execute()

        #pprint.pp(response) # Debug: Print the raw response to understand its structure

        title = ""
        duration = "00:00"
        views = "-"
        likes = "-"
        comments = "-"
        status = ""

        # Process the response
        if 'items' in response and len(response['items']) > 0:
            video_data = response['items'][0]
            title = video_data['snippet']['title']
            duration = video_data['contentDetails']['duration']
            views = video_data['statistics'].get('viewCount', 'N/A')
            likes = video_data['statistics'].get('likeCount', 'N/A')
            comments = video_data['statistics'].get('commentCount', 'N/A')
            status = video_data['status']['privacyStatus'] # public, private ou unlisted
        
        return {
            "title": title,
            "duration": duration,
            "views": views,
            "likes": likes,
            "comments": comments,
            "status": status
        }

    except Exception as e:
        print(f"An error occurred: {e}")
        return {
            "title": "",
            "duration": "00:00",
            "views": "-",
            "likes": "-",
            "comments": "-",
            "status": ""
        }
        

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
        #print("\n[DEBUG] Resposta bruta da API do YouTube:")
        #print(response) #.get("items", [])) # Imprime os itens para entender a estrutura real da resposta
        for item in response.get("items", []):
            vid_id = item["id"]["videoId"]
            # Para popular views e comentarios precisamos de uma SEGUNDA chamada à API (videos.list)
            # Mas para não complicar, apenas retornamos dados básicos do `search` por enquanto ou fazemos uma batch call.
            details = get_video_details(creds, vid_id) # Apenas para debug, pode ser removido depois
            
            # Vamos fazer o mapeamento limpo
            videos_reais.append({
                "id": vid_id,
                "titulo": item["snippet"]["title"],
                "resumo": item["snippet"]["description"] or "Sem descrição.",
                "ia_status": "Pendente", # Pode vir de um JOIN do banco na vida real
                "visibilidade": details["status"],
                "data": item["snippet"]["publishedAt"][:10],
                "views": details["views"],
                "comentarios": details["comments"],
                "likes": details["likes"],
                "thumb": item["snippet"]["thumbnails"]["medium"]["url"]
            })
            
        return {"videos": videos_reais}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
