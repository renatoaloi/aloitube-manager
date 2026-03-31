import React, { useState, useEffect } from "react";
import { ProcessingService } from "../api";
import { useModalContext } from "../components/GlobalModal";
import * as Lucide from "lucide-react";

export default function Descricoes() {
  const [descricoes, setDescricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showModal } = useModalContext();

  useEffect(() => {
    carregarDescricoes();

    // Polling a cada 3 segundos
    const interval = setInterval(carregarDescricoes, 3000);
    return () => clearInterval(interval);
  }, []);

  const carregarDescricoes = async () => {
    try {
      const data = await ProcessingService.listarDescricoes();
      setDescricoes(data);
    } catch (error) {
      console.error("Erro ao carregar as descrições.", error);
    } finally {
      setLoading(false);
    }
  };

  const verSugestoes = async (taskId) => {
    try {
      const data = await ProcessingService.obterDescricaoDetalhes(taskId);
      showModal({
        title: "Descrição e Tags (Ollama)",
        message: (
          <div style={{
            padding: "15px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "4px",
            color: "var(--text-h)",
            lineHeight: "1.8",
            fontSize: "15px",
            whiteSpace: "pre-wrap",
            maxHeight: "60vh",
            overflowY: "auto"
          }}>
            {data.sugestoes || "Processando descrição..."}
          </div>
        ),
        type: "success"
      });
    } catch (error) {
      showModal({
        title: "Erro",
        message: "Não foi possível carregar a descrição.",
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
            Descrições
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
          OLLAMA LLM AI
        </span>
      </div>

      {loading && descricoes.length === 0 ? (
        <div
          className="glass-panel"
          style={{ textAlign: "center", padding: "50px", color: "var(--text)" }}
        >
          Consultando IAs de geração...
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
                <th style={{ padding: "16px", fontSize: "12px" }}>TASK ID</th>
                <th style={{ padding: "16px", fontSize: "12px" }}>TRANSCR. REF</th>
                <th style={{ padding: "16px", fontSize: "12px" }}>IDENTIFICAÇÃO</th>
                <th style={{ padding: "16px", fontSize: "12px" }}>STATUS</th>
                <th style={{ padding: "16px", fontSize: "12px" }}>GERADO EM</th>
                <th style={{ padding: "16px", fontSize: "12px" }}>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {descricoes.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: "var(--text)" }}>
                    Nenhuma tarefa de descrição encontrada.
                  </td>
                </tr>
              )}
              {descricoes.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "16px", fontWeight: "600", color: "var(--text)", fontFamily: "var(--mono)", fontSize: "13px" }}>
                    #{item.id}
                  </td>
                  <td style={{ padding: "16px", fontWeight: "600", color: "var(--accent)", fontFamily: "var(--mono)", fontSize: "13px" }}>
                    T#{item.transcription_id}
                  </td>
                  <td style={{
                    padding: "16px",
                    color: "var(--text-h)",
                    fontWeight: "500",
                    fontSize: "14px",
                    maxWidth: "400px",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    lineHeight: "1.4"
                  }}>
                    {item.titulo}
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
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "800",
                        fontFamily: "var(--mono)",
                        textWrap: "nowrap",
                      }}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "16px", color: "var(--text)", fontSize: "12px", fontFamily: "var(--mono)" }}>
                    {new Date(item.criado_em).toLocaleString()}
                  </td>
                  <td style={{ padding: "16px" }}>
                    {item.status === "CONCLUIDO" ? (
                      <button
                        onClick={() => verSugestoes(item.id)}
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
                          e.currentTarget.style.borderColor = "var(--success)";
                          e.currentTarget.style.color = "var(--success)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.color = "var(--text-h)";
                        }}
                      >
                        <Lucide.LayoutList size={14} /> EXIBIR DESCRIÇÃO
                      </button>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--text)", fontFamily: "var(--mono)" }}>
                        {item.status === "ERRO" ? " IA Falhou" : "Pensando..."}
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
