import axios from "axios";

// O "Engarrafador". Toda chamada ou verificação oficial ao Python passa daqui.
// Fixa o Header de Content-Type e amarra a BaseURL cravada!
export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
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
  },
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
  },
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
      const response = await api.get("/downloads");
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
  },
};

export const ProcessingService = {
  extrairAudio: async (videoId) => {
    try {
      // O backend agora espera o videoId na URL
      const response = await api.post(`/extrair-audio/${videoId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao extrair áudio:", error);
      throw error;
    }
  },

  listarAudios: async () => {
    try {
      const response = await api.get("/audios");
      return response.data.audios;
    } catch (error) {
      console.error("Erro ao listar áudios:", error);
      throw error;
    }
  },

  transcreverAudio: async (audioId) => {
    try {
      const response = await api.post(`/transcrever-audio/${audioId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao transcrever áudio:", error);
      throw error;
    }
  },

  listarTranscricoes: async () => {
    try {
      const response = await api.get("/transcricoes");
      return response.data.transcricoes;
    } catch (error) {
      console.error("Erro ao listar transcrições:", error);
      throw error;
    }
  },

  obterTranscricaoConteudo: async (transcricaoId) => {
    try {
      const response = await api.get(`/transcricao-conteudo/${transcricaoId}`);
      return response.data.conteudo;
    } catch (error) {
      console.error("Erro ao obter conteúdo da transcrição:", error);
      throw error;
    }
  },

  gerarTitulos: async (transcriptionId) => {
    try {
      const response = await api.post(`/gerar-titulos/${transcriptionId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao gerar títulos:", error);
      throw error;
    }
  },

  listarTitulos: async () => {
    try {
      const response = await api.get("/titulos");
      return response.data.titulos;
    } catch (error) {
      console.error("Erro ao listar títulos:", error);
      throw error;
    }
  },

  obterTituloDetalhes: async (titleTaskId) => {
    try {
      const response = await api.get(`/titulo-detalhes/${titleTaskId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao obter detalhes do título:", error);
      throw error;
    }
  },

  gerarDescricao: async (transcriptionId) => {
    try {
      const response = await api.post(`/gerar-descricao/${transcriptionId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao gerar descrição:", error);
      throw error;
    }
  },

  listarDescricoes: async () => {
    try {
      const response = await api.get("/descricoes");
      return response.data.descricoes;
    } catch (error) {
      console.error("Erro ao listar descrições:", error);
      throw error;
    }
  },

  obterDescricaoDetalhes: async (descriptionTaskId) => {
    try {
      const response = await api.get(`/descricao-detalhes/${descriptionTaskId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao obter detalhes da descrição:", error);
      throw error;
    }
  },

  gerarThumbnails: async (transcriptionId) => {
    try {
      const response = await api.post(`/gerar-thumbnails/${transcriptionId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao gerar thumbnails:", error);
      throw error;
    }
  },

  listarThumbnails: async () => {
    try {
      const response = await api.get("/thumbnails");
      return response.data.thumbnails;
    } catch (error) {
      console.error("Erro ao listar thumbnails:", error);
      throw error;
    }
  },

  obterThumbnailDetalhes: async (thumbnailTaskId) => {
    try {
      const response = await api.get(`/thumbnail-detalhes/${thumbnailTaskId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao obter detalhes do thumbnail:", error);
      throw error;
    }
  },
};
