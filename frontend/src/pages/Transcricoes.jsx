import React, { useState, useEffect } from "react";
import { ProcessingService } from "../api";
import { useModalContext } from "../components/GlobalModal";
import * as Lucide from "lucide-react";

export default function Transcricoes() {
  const [transcricoes, setTranscricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showModal } = useModalContext();

  useEffect(() => {
    carregarTranscricoes();

    // Polling a cada 3 segundos
    const interval = setInterval(carregarTranscricoes, 3000);
    return () => clearInterval(interval);
  }, []);

  const carregarTranscricoes = async () => {
    try {
      const data = await ProcessingService.listarTranscricoes();
      setTranscricoes(data);
    } catch (error) {
      console.error("Erro ao carregar as transcrições.", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirTexto = async (taskId) => {
    try {
      const conteudo = await ProcessingService.obterTranscricaoConteudo(taskId);
      showModal({
        title: "Conteúdo da Transcrição",
        message: (
          <div style={{ 
            maxHeight: "400px", 
            overflowY: "auto", 
            padding: "10px", 
            background: "rgba(0,0,0,0.3)", 
            borderRadius: "4px",
            fontFamily: "var(--mono)",
            fontSize: "13px",
            lineHeight: "1.6",
            whiteSpace: "pre-wrap",
            color: "var(--text-h)"
          }}>
            {conteudo || "Arquivo vazio ou processando..."}
          </div>
        ),
        type: "info"
      });
    } catch (error) {
      showModal({
        title: "Erro de Leitura",
        message: "Não foi possível carregar o conteúdo do arquivo txt.",
        type: "error"
      });
    }
  };

  const gerarSugestaoTitulos = async (transcriptionId) => {
    try {
      await ProcessingService.gerarTitulos(transcriptionId);
      showModal({
        title: "Processamento Iniciado",
        message: "O Ollama está analisando a transcrição para gerar títulos virais. Verifique a Central de Títulos em instantes.",
        type: "success"
      });
    } catch (error) {
      showModal({
        title: "Erro no Ollama",
        message: "Não foi possível iniciar a geração de títulos.",
        type: "error"
      });
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
            Transcrições
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
          WHISPER ENGINE
        </span>
      </div>

      {loading && transcricoes.length === 0 ? (
        <div
          className="glass-panel"
          style={{ textAlign: "center", padding: "50px", color: "var(--text)" }}
        >
          Consultando registros do Whisper...
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
                  Task ID
                </th>
                <th
                  style={{
                    padding: "16px",
                    fontSize: "12px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Audio Ref
                </th>
                <th
                  style={{
                    padding: "16px",
                    fontSize: "12px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "16px",
                    fontSize: "12px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Criado em
                </th>
                <th
                  style={{
                    padding: "16px",
                    fontSize: "12px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {transcricoes.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text)",
                    }}
                  >
                    Nenhuma transcrição encontrada.
                  </td>
                </tr>
              )}
              {transcricoes.map((item) => (
                <tr
                  key={item.id}
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
                      color: "var(--text)",
                      fontFamily: "var(--mono)",
                      fontSize: "13px",
                    }}
                  >
                    #{item.id}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      fontWeight: "600",
                      color: "var(--accent)",
                      fontFamily: "var(--mono)",
                      fontSize: "13px",
                    }}
                  >
                    A#{item.audio_id}
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        background:
                          item.status === "CONCLUIDO"
                            ? "rgba(16, 185, 129, 0.1)"
                            : item.status === "PROCESSANDO"
                              ? "rgba(245, 158, 11, 0.1)"
                              : "rgba(239, 68, 68, 0.1)",
                        color:
                          item.status === "CONCLUIDO"
                            ? "var(--success)"
                            : item.status === "PROCESSANDO"
                              ? "var(--warning)"
                              : "var(--danger)",
                        border: "1px solid",
                        borderColor:
                          item.status === "CONCLUIDO"
                            ? "var(--success)"
                            : item.status === "PROCESSANDO"
                              ? "var(--warning)"
                              : "var(--danger)",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "800",
                        letterSpacing: "0.5px",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      color: "var(--text)",
                      fontSize: "12px",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    {new Date(item.criado_em).toLocaleString()}
                  </td>
                  <td style={{ padding: "16px" }}>
                    {item.status === "CONCLUIDO" ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => abrirTexto(item.id)}
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
                        >
                          <Lucide.FileText size={14} /> VER TEXTO
                        </button>

                        <button
                          onClick={() => gerarSugestaoTitulos(item.id)}
                          title="Gerar Sugestões de Títulos com Ollama"
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
                            e.currentTarget.style.borderColor = "var(--warning)";
                            e.currentTarget.style.color = "var(--warning)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--text-h)";
                          }}
                        >
                          <Lucide.Lightbulb size={14} /> IA TITULOS
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
                        {item.status === "ERRO" ? "Falhou" : "Processando..."}
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
