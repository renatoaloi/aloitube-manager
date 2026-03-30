import React, { useState, useEffect } from 'react';
import { DownloadService } from '../api';
import { useModalContext } from '../components/GlobalModal';

export default function Downloads() {
    const [downloads, setDownloads] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showModal } = useModalContext();

    useEffect(() => {
        carregarDownloads();

        // Polling basico a cada 3 segundos pra ver a barra/status de "Baixando"
        const interval = setInterval(carregarDownloads, 3000);
        return () => clearInterval(interval);
    }, []);

    const carregarDownloads = async () => {
        try {
            const data = await DownloadService.listarDownloads();
            setDownloads(data);
        } catch (error) {
            console.error("Erro ao carregar os downloads.", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
                <h1 style={{ fontSize: '32px', margin: 0, color: 'var(--text-h)', fontWeight: '900', letterSpacing: '-1px' }}>
                    Central de <span style={{ color: 'var(--accent)', textShadow: 'var(--shadow-neon)' }}>Extração</span>
                </h1>
                <span style={{ fontSize: '12px', fontWeight: '800', background: 'var(--surface)', color: 'var(--accent)', padding: '6px 14px', borderRadius: '4px', border: '1px solid var(--border)', letterSpacing: '1px' }}>
                    ARQUIVOS LOCAIS
                </span>
            </div>

            {loading && downloads.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '50px', color: 'var(--text)' }}>Carregando histórico transacional...</div>
            ) : (
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', margin: 0 }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)', color: 'var(--text-h)' }}>
                                <th style={{ padding: '16px', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>ID da Stream</th>
                                <th style={{ padding: '16px', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Identificação</th>
                                <th style={{ padding: '16px', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Timestamp</th>
                                <th style={{ padding: '16px', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Status Core</th>
                                <th style={{ padding: '16px', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Módulos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {downloads.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text)' }}>
                                        Nenhuma requisição de extração detectada. Refaça a operação na aba "Ativos Digitais".
                                    </td>
                                </tr>
                            )}
                            {downloads.map(dl => (
                                <tr key={dl.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <td style={{ padding: '16px', fontWeight: '600', color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: '13px' }}>#{dl.video_id}</td>
                                    <td style={{ padding: '16px', color: 'var(--text-h)', fontWeight: '500', fontSize: '14px' }}>{dl.titulo}</td>
                                    <td style={{ padding: '16px', color: 'var(--text)', fontSize: '12px', fontFamily: 'var(--mono)' }}>{dl.criado_em}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            background: dl.status === 'CONCLUIDO' ? 'rgba(16, 185, 129, 0.1)' : (dl.status === 'BAIXANDO' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                                            color: dl.status === 'CONCLUIDO' ? 'var(--success)' : (dl.status === 'BAIXANDO' ? 'var(--warning)' : 'var(--danger)'),
                                            border: '1px solid',
                                            borderColor: dl.status === 'CONCLUIDO' ? 'var(--success)' : (dl.status === 'BAIXANDO' ? 'var(--warning)' : 'var(--danger)'),
                                            borderRadius: '4px',
                                            textShadow: dl.status === 'CONCLUIDO' ? '0 0 10px rgba(16,185,129,0.5)' : 'none',
                                            fontSize: '10px',
                                            fontWeight: '800',
                                            letterSpacing: '0.5px',
                                            fontFamily: 'var(--mono)'
                                        }}>
                                            {dl.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        {dl.status === 'CONCLUIDO' ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button style={{ padding: '6px 12px', background: 'var(--bg)', color: 'var(--text-h)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}
                                                    onMouseEnter={(e) => { e.target.style.background = 'var(--surface-hover)'; e.target.style.borderColor = 'var(--accent)'; }}
                                                    onMouseLeave={(e) => { e.target.style.background = 'var(--bg)'; e.target.style.borderColor = 'var(--border)'; }}
                                                >
                                                    Mute
                                                </button>
                                                <button style={{ padding: '6px 12px', background: 'var(--danger)', color: '#fff', border: '1px solid var(--danger-hover)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', boxShadow: '0 0 10px rgba(239,68,68,0.3)' }}>
                                                    I.A.
                                                </button>
                                            </div>
                                        ) : dl.status.startsWith('ERRO') ? (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await DownloadService.tentarNovamente(dl.id);
                                                        showModal({
                                                            title: 'Sobrescrita Injetada',
                                                            message: res.mensagem,
                                                            type: 'success'
                                                        });
                                                        carregarDownloads();
                                                    } catch (e) {
                                                        showModal({
                                                            title: 'Erro de Execução',
                                                            message: 'O subsistema rejeitou a nova tentativa de download.',
                                                            type: 'error'
                                                        });
                                                    }
                                                }}
                                                style={{ padding: '6px 12px', background: 'transparent', color: 'var(--warning)', border: '1px solid var(--warning)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}
                                                onMouseEnter={(e) => e.target.style.background = 'rgba(245, 158, 11, 0.15)'}
                                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                            >
                                                Force Retry
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: '11px', color: 'var(--text)', fontFamily: 'var(--mono)' }}>Aguardando...</span>
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
