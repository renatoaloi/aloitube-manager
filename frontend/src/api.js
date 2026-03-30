import axios from 'axios';

// O "Engarrafador". Toda chamada ou verificação oficial ao Python passa daqui.
// Fixa o Header de Content-Type e amarra a BaseURL cravada!
export const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Nossa Classe de Autenticação Central
// Serve para enveloparmos toda regra de Polling, Auth, etc, sem poluir a tela.
export const AuthService = {
    // Exemplo de helper para quando voltarmos do "/auth/callback" do Google
    getOauthStatus: async (trackingId) => {
        try {
            const response = await api.get(`/status/${trackingId}`);
            return response.data;
        } catch (error) {
            console.error("Contexto WS ou HTTP falhou:", error);
            throw error;
        }
    }
};

// Serviço para Integração com YouTube
export const YoutubeService = {
    listarMeusVideos: async (appName = "aloitech") => {
        try {
            const response = await api.get(`/videos/${appName}`);
            return response.data.videos; // Retorna o array
        } catch (error) {
            console.error("Erro ao listar videos do YouTube:", error);
            throw error;
        }
    }
};

// Serviço de Downloads
export const DownloadService = {
    baixarVideo: async (videoId) => {
        try {
            const response = await api.post(`/baixar-video/${videoId}`);
            return response.data;
        } catch (error) {
            console.error("Erro ao iniciar download:", error);
            throw error;
        }
    },
    
    listarDownloads: async () => {
        try {
            const response = await api.get('/downloads');
            return response.data.downloads;
        } catch (error) {
            console.error("Erro ao listar downloads:", error);
            throw error;
        }
    },

    tentarNovamente: async (taskId) => {
        try {
            const response = await api.post(`/tentar-novamente/${taskId}`);
            return response.data;
        } catch (error) {
            console.error("Erro ao tentar novamente download:", error);
            throw error;
        }
    }
};