# 📚 Roteiro da Aula (Parte 3): Autenticação Multi-App do Google e OAuth2

## 🎯 Objetivo
Um dos grandes diferenciais deste projeto (e um ótimo aprendizado avançado para os alunos) é a capacidade de **usar Múltiplos Aplicativos do Google Cloud** no mesmo sistema. 
Ao invés de estarmos presos a um único `client_secret.json`, nosso sistema gerenciará dinamicamente credenciais para o Aplicativo "AloiTech" e para o Aplicativo "RegistroParanormal", gravando o acesso do canal certo, na hora certa, tudo pela mesma rota!

---

## 🛠️ Etapa 12: A Burocracia no Google Cloud e Pastas

Sempre bom fazer junto com os alunos:
1. Vá até o **Google Cloud Console**, crie os Projetos (um para AloiTech, outro para Paranormal).
2. Ative a **YouTube Data API v3** neles.
3. Configure a **Tela de Consentimento OAuth**.
4. Crie as Credenciais: **ID do Cliente OAuth (App Web)**. 
   - *Atenção:* Em "URIs de redirecionamento", insira `http://localhost:8000/auth/callback` para ambos!
5. Baixe os JSONs gerados. Para não virar uma bagunça, **crie uma pasta chamada `secrets`** na raiz do projeto e jogue os arquivos lá dentro com nomes fáceis (ex: `secrets/aloitech.json` e `secrets/paranormal.json`).

Comando de Instalação das bibliotecas:
```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

---

## 🗄️ Etapa 13: Modelando a Nova Tabela Multi-App (Canais)

Vamos guardar a "Chave Mestra" (Token) e também anotar de **qual App** ela veio, pro nosso sistema saber qual credencial usar mais tarde lá no robô (Huey).

```python
# models.py (adicione lá embaixo)

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
```

---

## 🔐 Etapa 14: Rotas de Autenticação (Setup Inovador Multi-Tenant)

Aqui vem o grande pulo do gato! Em vez de "chumbar" 1 arquivo de credencial só, vamos receber do usuário em qual App ele está logando e usar um "truque" autorizado pelo padrão OAuth2: o parâmetro `state`!

> [!WARNING]
> Nas versões recentes da biblioteca `google-auth-oauthlib`, o Google ativou o **PKCE** (Proof Key for Code Exchange) por padrão. Isso significa que ele gera um segredo (`code_verifier`) na ida e exige ele de volta no callback para evitar interceptações. Para nossa dinâmica com OAuth local funcionar em chamadas assíncronas no FastAPI sem a burocracia do `SessionMiddleware`, adotamos um pequeno dicionário em memória para transferir esse verificador seguro entre nossas duas rotas!

```python
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
    
    # Trocamos o código temporário por chaves fixas resgatando o PKCE da memória
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
```
*(Lembre-se de adicionar `app.include_router(auth_router)` no seu `main.py`!)*

---

## 💻 Etapa 15: O Front-End (Design Pattern Brilhante)

Explique para os alunos o nível profissional que eles chegaram. No React ou HTML, você agora pode ter menus independentes, e os botões de ação são absurdamente simples:

**`[ ENTRAR COM CANAL ALOITECH ]`** => Ao clicar, executa: `window.location.href = "http://localhost:8000/auth/login/aloitech"`

**`[ ENTRAR COM CANAL PARANORMAL ]`** => Ao clicar, executa: `window.location.href = "http://localhost:8000/auth/login/paranormal"`

Tudo se resolve localmente, com 100% das chaves (Json e Tokens) perfeitamente guardadas e roteadas no Python pelo parâmetro `state` do Google!
