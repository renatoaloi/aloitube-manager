import React, { useState, useEffect } from "react";
import { YoutubeService, DownloadService } from "../api";
import { useModalContext } from "../components/GlobalModal";

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showModal } = useModalContext();

  useEffect(() => {
    carregarVideos();
  }, []);

  const carregarVideos = async () => {
    try {
      setLoading(true);
      const data = await YoutubeService.listarMeusVideos();
      setVideos(data);
    } catch (error) {
      showModal({
        title: "Acesso Negado",
        message:
          "Erro ao carregar os vídeos do canal. Verifique se o módulo de OAuth está conectado.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "30px",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "15px",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            margin: 0,
            color: "var(--text-h)",
            fontWeight: "900",
            letterSpacing: "-1px",
          }}
        >
          Ativos{" "}
          <span
            style={{ color: "var(--accent)", textShadow: "var(--shadow-neon)" }}
          >
            Digitais
          </span>
        </h1>
        <span
          style={{
            fontSize: "12px",
            fontWeight: "800",
            background: "var(--surface)",
            color: "var(--accent)",
            padding: "6px 14px",
            borderRadius: "4px",
            border: "1px solid var(--border)",
            letterSpacing: "1px",
          }}
        >
          {loading ? "SINC... 🔄" : `${videos.length} REGISTROS`}
        </span>
      </div>

      {/* Container da Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {loading ? (
          <div
            className="glass-panel"
            style={{
              textAlign: "center",
              padding: "50px",
              color: "var(--text)",
            }}
          >
            Extraindo fragmentos do servidor principal...
          </div>
        ) : (
          videos.map((vid) => (
            <VideoListItem key={vid.id} vid={vid} showModal={showModal} />
          ))
        )}
      </div>
    </div>
  );
}

// Sub-componente extraído
function VideoListItem({ vid, showModal }) {
  const [isHovered, setIsHovered] = useState(false);

  const icons = {
    download: "⬇️",
    comments: "💬",
    transcript: "📝",
    cover: "🖼️",
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="glass-panel"
      style={{
        display: "flex",
        background: isHovered ? "var(--surface-hover)" : "var(--surface)",
        border: "1px solid",
        borderColor: isHovered ? "var(--accent)" : "var(--border)",
        borderLeft: isHovered
          ? "4px solid var(--accent)"
          : "4px solid var(--border)",
        padding: "16px",
        transition: "all 0.2s ease",
        boxShadow: isHovered ? "var(--shadow-neon)" : "none",
        transform: isHovered ? "translateX(5px)" : "none",
        gap: "24px",
        alignItems: "center",
      }}
    >
      {/* 1. Thumbnail Pequena */}
      <div
        style={{
          flexShrink: 0,
          width: "160px",
          height: "90px",
          background: "#000",
          overflow: "hidden",
          position: "relative",
          borderRadius: "4px",
          border: "1px solid var(--border)",
        }}
      >
        <img
          src={vid.thumb}
          alt="Thumbnail"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: isHovered ? 1 : 0.7,
            transition: "opacity 0.2s",
            filter: isHovered ? "none" : "grayscale(30%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            background: "rgba(3,7,18,0.9)",
            color: "var(--accent)",
            fontSize: "10px",
            padding: "4px 6px",
            fontWeight: "800",
            fontFamily: "var(--mono)",
          }}
        >
          10:24
        </div>
      </div>

      {/* 2. Informações Principais */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            fontSize: "16px",
            margin: "0 0 6px 0",
            color: "var(--text-h)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: "600",
          }}
        >
          {vid.titulo}
        </h3>
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: "13px",
            color: "var(--text)",
            lineHeight: "1.4",
          }}
        >
          {vid.resumo.slice(0, 100)}...
        </p>

        {/* Metadados */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            fontSize: "11px",
            color: "var(--text)",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color:
                vid.visibilidade === "public"
                  ? "var(--success)"
                  : "var(--warning)",
            }}
          >
            {vid.visibilidade === "public" ? "🌐" : "🔒"} {vid.visibilidade}
          </span>
          <span>📅 {vid.data}</span>
          <span style={{ fontFamily: "var(--mono)" }}>👁️ {vid.views}</span>
          <span style={{ fontFamily: "var(--mono)" }}>
            💬 {vid.comentarios}
          </span>
        </div>
      </div>

      {/* 4. Ações Rápidas (Ícones) */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderLeft: "1px solid var(--border)",
          paddingLeft: "24px",
        }}
      >
        <ActionButton
          icon={icons.download}
          tooltip="Baixar Vídeo"
          hoverColor="var(--accent)"
          onClick={async () => {
            try {
              const res = await DownloadService.baixarVideo(vid.id);
              showModal({
                title: "Comando Aceito",
                message: `Status da Operação: ${res.mensagem || "Mando baixar!"}. Acompanhe o progresso na Central de Extração.`,
                type: "success",
              });
            } catch (e) {
              showModal({
                title: "Falha na Operação",
                message:
                  "Não foi possível acionar o pipeline de download neste momento.",
                type: "error",
              });
            }
          }}
        />
        {/* <ActionButton
                    icon={icons.comments}
                    tooltip="Extrair Comentários"
                    hoverColor="var(--accent)"
                />
                <ActionButton
                    icon={icons.transcript}
                    tooltip="Gerar Transcrição"
                    hoverColor="var(--success)"
                />
                <ActionButton
                    icon={icons.cover}
                    tooltip="Baixar Capa"
                    hoverColor="var(--warning)"
                /> */}
      </div>
    </div>
  );
}

// Botão de Ação Isolado
function ActionButton({ icon, tooltip, hoverColor, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      title={tooltip}
      style={{
        width: "38px",
        height: "38px",
        border: "1px solid",
        borderColor: isHovered ? hoverColor : "var(--border)",
        background: isHovered ? `rgba(255, 255, 255, 0.05)` : "var(--bg)",
        color: "var(--text-h)",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontSize: "18px",
        boxShadow: isHovered ? `0 0 10px ${hoverColor}40` : "none",
        transform: isHovered ? "scale(1.05)" : "scale(1)",
      }}
    >
      {icon}
    </button>
  );
}
