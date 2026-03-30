import React, { useState, useEffect } from "react";
import { ProcessingService } from "../api";
import { useModalContext } from "../components/GlobalModal";
import * as Lucide from "lucide-react";

export default function Extracoes() {
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showModal } = useModalContext();

  useEffect(() => {
    carregarAudios();

    // Polling a cada 3 segundos
    const interval = setInterval(carregarAudios, 3000);
    return () => clearInterval(interval);
  }, []);

  const carregarAudios = async () => {
    try {
      const data = await ProcessingService.listarAudios();
      setAudios(data);
    } catch (error) {
      console.error("Erro ao carregar os áudios.", error);
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
          Central de{" "}
          <span
            style={{ color: "var(--accent)", textShadow: "var(--shadow-neon)" }}
          >
            Extração
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
          AUDIO REPOSITORY
        </span>
      </div>

      {loading && audios.length === 0 ? (
        <div
          className="glass-panel"
          style={{ textAlign: "center", padding: "50px", color: "var(--text)" }}
        >
          Sincronizando banco de áudios...
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              margin: 0,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--surface-hover)",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text-h)",
                }}
              >
                <th
                  style={{
                    padding: "16px",
                    fontSize: "12px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  ID Referência
                </th>
                <th
                  style={{
                    padding: "16px",
                    fontSize: "12px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Timestamp
                </th>
                <th
                  style={{
                    padding: "16px",
                    fontSize: "12px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Status Core
                </th>
                <th
                  style={{
                    padding: "16px",
                    fontSize: "12px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {audios.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text)",
                    }}
                  >
                    Nenhuma extração detectada. Use o comando de áudio em "Ativos Digitais".
                  </td>
                </tr>
              )}
              {audios.map((audio) => (
                <tr
                  key={audio.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--surface-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "16px",
                      fontWeight: "600",
                      color: "var(--accent)",
                      fontFamily: "var(--mono)",
                      fontSize: "13px",
                    }}
                  >
                    #{audio.video_id}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      color: "var(--text)",
                      fontSize: "12px",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    {new Date(audio.criado_em).toLocaleString()}
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        background:
                          audio.status === "CONCLUIDO"
                            ? "rgba(16, 185, 129, 0.1)"
                            : audio.status === "PROCESSANDO"
                              ? "rgba(245, 158, 11, 0.1)"
                              : "rgba(239, 68, 68, 0.1)",
                        color:
                          audio.status === "CONCLUIDO"
                            ? "var(--success)"
                            : audio.status === "PROCESSANDO"
                              ? "var(--warning)"
                              : "var(--danger)",
                        border: "1px solid",
                        borderColor:
                          audio.status === "CONCLUIDO"
                            ? "var(--success)"
                            : audio.status === "PROCESSANDO"
                              ? "var(--warning)"
                              : "var(--danger)",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "800",
                        letterSpacing: "0.5px",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      {audio.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "16px" }}>
                    {audio.status === "CONCLUIDO" ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          style={{
                            padding: "6px 12px",
                            background: "var(--bg)",
                            color: "var(--text-h)",
                            border: "1px solid var(--border)",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--accent)";
                            e.currentTarget.style.color = "var(--accent)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--text-h)";
                          }}
                          onClick={async () => {
                            try {
                              const res = await ProcessingService.transcreverAudio(audio.id);
                              showModal({
                                title: "Transcrição Iniciada",
                                message: res.mensagem,
                                type: "success",
                              });
                            } catch (e) {
                              showModal({
                                title: "Erro de Módulo",
                                message: "Falha ao iniciar transcrição de áudio. Verifique se o áudio já foi extraído.",
                                type: "error",
                              });
                            }
                          }}
                        >
                          <Lucide.TextInitial size={18} color="var(--accent)" />
                        </button>
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text)",
                          fontFamily: "var(--mono)",
                        }}
                      >
                        Aguardando...
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
