import React, { createContext, useContext, useState } from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

const ModalContext = createContext();

export const useModalContext = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState(null);

  const showModal = ({
    title,
    message,
    type = "info",
    onConfirm,
    onCancel,
  }) => {
    setModalConfig({ title, message, type, onConfirm, onCancel });
  };

  const closeModal = () => {
    setModalConfig(null);
  };

  return (
    <ModalContext.Provider value={{ showModal, closeModal }}>
      {children}
      {modalConfig && <Modal config={modalConfig} onClose={closeModal} />}
    </ModalContext.Provider>
  );
};

const Modal = ({ config, onClose }) => {
  const { title, message, type, onConfirm, onCancel } = config;

  // Define cor e icone baseado no type
  const isError = type === "error";
  const isSuccess = type === "success";

  let Icon = Info;
  let accentColor = "var(--accent)";

  if (isError) {
    Icon = AlertCircle;
    accentColor = "var(--danger)";
  } else if (isSuccess) {
    Icon = CheckCircle;
    accentColor = "var(--success)";
  }

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backgroundColor: "rgba(3, 7, 18, 0.8)",
        backdropFilter: "blur(4px)",
        animation: "overlayShow 0.2s ease",
      }}
    >
      <div
        className="glass-panel"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "450px",
          padding: "24px",
          border: `1px solid ${accentColor}`,
          boxShadow: `0 0 20px ${accentColor}20`,
          animation: "slideDownAndFade 0.3s ease",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Icon size={24} color={accentColor} />
            <h2
              style={{
                fontSize: "18px",
                margin: 0,
                color: "var(--text-h)",
                fontWeight: "600",
              }}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{ color: "var(--text)", fontSize: "15px", lineHeight: "1.5" }}
        >
          {message}
        </div>

        {/* Footer / Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "8px",
          }}
        >
          {onCancel && (
            <button
              onClick={handleCancel}
              style={{
                padding: "10px 16px",
                background: "transparent",
                color: "var(--text-h)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
              }}
              onMouseEnter={(e) =>
                (e.target.style.background = "var(--surface-hover)")
              }
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleConfirm}
            style={{
              padding: "10px 24px",
              background: `${accentColor}20`,
              color: accentColor,
              border: `1px solid ${accentColor}`,
              boxShadow: `0 0 10px ${accentColor}40`,
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
            }}
            onMouseEnter={(e) =>
              (e.target.style.background = `${accentColor}40`)
            }
            onMouseLeave={(e) =>
              (e.target.style.background = `${accentColor}20`)
            }
          >
            {onConfirm ? "Confirmar" : "Entendido"}
          </button>
        </div>
      </div>
    </div>
  );
};
