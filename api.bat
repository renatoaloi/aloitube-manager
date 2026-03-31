rem cd C:\dev\aloitech\AloiTubeManager\backend
rem venv\Scripts\python uvicorn main:app --reload

@echo off
:: --- CONFIGURAÇÕES ---
:: Caminho para a pasta onde está seu arquivo main.py
set PROJECT_DIR=C:\dev\aloitech\AloiTubeManager\backend
:: Nome do ambiente virtual (venv)
set VENV_NAME=venv
:: Nome do arquivo app (sem o .py) e a instância do app (geralmente main:app)
set APP_MODULE=main:app

:: --- EXECUÇÃO ---
echo Entrando no diretorio do projeto...
cd /d %PROJECT_DIR%

echo Ativando ambiente virtual...
call %VENV_NAME%\Scripts\activate.bat

echo Iniciando Uvicorn...
:: Adicione --reload se desejar reiniciar automaticamente ao salvar
uvicorn %APP_MODULE% --host 0.0.0.0 --port 8000 --reload

:: Pausa para ver erros, caso o uvicorn feche
rem pause
