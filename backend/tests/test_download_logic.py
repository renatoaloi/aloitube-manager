import os
import yt_dlp
import pytest
import subprocess

def test_ffmpeg_accessible():
    """ Verifica se o ffmpeg está no PATH do sistema """
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True)
        assert result.returncode == 0
        assert "ffmpeg version" in result.stdout
    except FileNotFoundError:
        pytest.fail("FFmpeg não encontrado no sistema!")

def test_cookies_file_exists():
    """ Verifica se o arquivo de cookies está no local esperado """
    # __file__ é backend/tests/test_download_logic.py
    # secrets está em backend/secrets
    base_path = os.path.dirname(os.path.dirname(__file__))
    cookies_path = os.path.join(base_path, "secrets", "cookies.txt")
    assert os.path.exists(cookies_path), f"Arquivo de cookies não encontrado em {cookies_path}"

def test_ytdlp_info_extraction():
    """ 
    Verifica se o yt-dlp consegue extrair informações utilizando 
    as opções simplificadas (com cookies).
    """
    video_id = "Qe82J_ThIhc" # O vídeo que estava dando erro
    youtube_url = f"https://www.youtube.com/watch?v={video_id}"
    
    base_path = os.path.dirname(os.path.dirname(__file__))
    cookies_path = os.path.join(base_path, "secrets", "cookies.txt")
    
    # Opções resilientes
    ydl_opts = {
        'format': 'bestvideo+bestaudio/best',
        'cookiefile': cookies_path if os.path.exists(cookies_path) else None,
        'quiet': True,
        'no_warnings': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            assert info['id'] == video_id
            assert 'title' in info
            # Se chegamos aqui, os cookies e o seletor de formato básico funcionam
    except Exception as e:
        print(f"\n[ERROR] Detalhes da falha: {str(e)}")
        pytest.fail(f"Falha na extração de info: {e}")

if __name__ == "__main__":
    pytest.main([__file__])
