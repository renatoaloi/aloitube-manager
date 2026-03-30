# auth.py
import os
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from google_auth_oauthlib.flow import Flow
from database import get_db
from models import YoutubeChannel

router = APIRouter()
SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']

# Variável de memória para armazenar o code_verifier temporariamente (PKCE workaround para apps locais)
_verifier_store = {}

def get_secret_path(app_name: str):
    """Busca o JSON correto na nossa pasta de credenciais"""
    path = f"secrets/{app_name}.json"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Credencial {app_name}.json não encontrada.")
    return path

@router.get("/auth/login/{app_name}")
def login_google(app_name: str):
    """ Rota que o Front-end vai chamar (ex: /auth/login/aloitech) """
    
    flow = Flow.from_client_secrets_file(
        get_secret_path(app_name),
        scopes=SCOPES,
        redirect_uri='http://localhost:8000/auth/callback'
    )
    
    # Geramos a URL e injetamos o 'app_name' no parâmetro 'state'
    # Esse é um envelope lacrado. O Google vai devolvê-lo intacto pra gente no fim!
    authorization_url, state = flow.authorization_url(
        access_type='offline',          
        include_granted_scopes='true',
        # prompt='consent',  # << REMOVIDO: Assim o Google não pede permissão toda santa vez        
        state=app_name # <<< O SEGREDO ESTÁ AQUI
    )
    
    # Salvar o code_verifier (PKCE) gerado em memória
    _verifier_store[app_name] = getattr(flow, 'code_verifier', None)
    
    return RedirectResponse(authorization_url)


@router.get("/auth/callback")
def auth_callback(code: str = Query(None), state: str = Query(None), db: Session = Depends(get_db)):
    """ A rota alvo genérica que o Google chama de volta """
    if not code or not state:
        raise HTTPException(status_code=400, detail="Retorno inválido do Google.")
        
    app_name = state # Recuperamos em qual app a pessoa clicou lá no início!
    
    flow = Flow.from_client_secrets_file(
        get_secret_path(app_name),
        scopes=SCOPES,
        redirect_uri='http://localhost:8000/auth/callback'
    )
    
    # Trocamos o código temporário por chaves fixas
    code_verifier = _verifier_store.get(app_name)
    
    if code_verifier:
        flow.fetch_token(code=code, code_verifier=code_verifier)
    else:
        flow.fetch_token(code=code)
        
    credentials = flow.credentials
    
    # Gravamos o Sucesso Absoluto no nosso SQLite
    # 1. Verificamos se esse App já está no banco pra não criar duplicado
    canal_db = db.query(YoutubeChannel).filter(YoutubeChannel.nome_app == app_name).first()
    
    if canal_db:
        # Atualiza o token
        canal_db.access_token = credentials.token
        # Só atualiza o refresh_token se o Google tiver mandado um novo
        if credentials.refresh_token:
            canal_db.refresh_token = credentials.refresh_token
    else:
        # Cria um novo registro
        canal_db = YoutubeChannel(
            nome_app=app_name,
            access_token=credentials.token,
            refresh_token=credentials.refresh_token
        )
        db.add(canal_db)
        
    db.commit()
    
    # Em vez de retornar um JSON feio na tela, redirecionamos ele de volta pro nosso React!
    return RedirectResponse(url="http://localhost:5173/home")