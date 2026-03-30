import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Video, Download, Settings, Menu, X, Activity } from 'lucide-react';

export default function SidebarLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();

    // Ajuste responsivo de tela
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsMobile(true);
                setIsSidebarOpen(false);
            } else {
                setIsMobile(false);
                setIsSidebarOpen(true);
            }
        };

        // Checagem inicial
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const navItems = [
        { path: '/home', icon: Home, label: 'Painel Central' },
        { path: '/videos', icon: Video, label: 'Ativos Digitais' },
        { path: '/downloads', icon: Download, label: 'Central de Extração' },
    ];

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--sans)', overflow: 'hidden' }}>

            {/* Overlay Escuro para Mobile quando Menu está aberto */}
            {isMobile && isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 7, 18, 0.8)', backdropFilter: 'blur(4px)', zIndex: 40 }}
                />
            )}

            {/* Menu Lateral Estilo Cyberpunk */}
            <aside style={{ 
                width: '260px', 
                backgroundColor: 'var(--surface)', 
                borderRight: '1px solid var(--border)', 
                padding: '24px 20px',
                position: isMobile ? 'fixed' : 'relative',
                top: 0,
                bottom: 0,
                left: isSidebarOpen ? 0 : '-260px',
                marginLeft: (!isMobile && !isSidebarOpen) ? '-260px' : '0',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                boxShadow: isSidebarOpen && isMobile ? 'var(--shadow-lg)' : 'none'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingLeft: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity color="var(--accent)" size={24} style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }} />
                        <h2 style={{ color: 'var(--text-h)', fontWeight: '900', letterSpacing: '-0.5px', margin: 0, fontSize: '20px' }}>Aloi.<span style={{ color: 'var(--accent)', textShadow: 'var(--shadow-neon)' }}>CORE</span></h2>
                    </div>
                    {isMobile && (
                        <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--text)' }}>
                            <X size={24} />
                        </button>
                    )}
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link 
                                key={item.path}
                                to={item.path} 
                                onClick={() => isMobile && setIsSidebarOpen(false)}
                                style={{ 
                                    textDecoration: 'none', 
                                    color: isActive ? 'var(--accent)' : 'var(--text)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '15px', 
                                    fontWeight: isActive ? '600' : '500',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    background: isActive ? 'var(--accent-glow)' : 'transparent',
                                    border: isActive ? '1px solid rgba(34, 211, 238, 0.3)' : '1px solid transparent',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'var(--surface-hover)';
                                        e.currentTarget.style.color = 'var(--text-h)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--text)';
                                    }
                                }}
                            >
                                <item.icon size={20} /> {item.label}
                            </Link>
                        );
                    })}
                    
                    <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                        <Link to="#" onClick={() => isMobile && setIsSidebarOpen(false)} style={{ 
                                textDecoration: 'none', 
                                color: 'var(--text)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '15px', 
                                fontWeight: '500',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--surface-hover)';
                                e.currentTarget.style.color = 'var(--text-h)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--text)';
                            }}
                        >
                            <Settings size={20} /> Parâmetros UI
                        </Link>
                    </div>
                </nav>
            </aside>

            {/* O Recheio do Sanduíche (Área Principal) */}
            <main style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100vh', 
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                background: 'radial-gradient(circle at top right, rgba(34, 211, 238, 0.05), transparent 400px), var(--bg)'
            }}>
                {/* Header Superior Principal */}
                <header className="glass-panel" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '0 20px', 
                    height: '64px',
                    borderBottom: '1px solid var(--border)',
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0,
                    boxShadow: 'none',
                    flexShrink: 0,
                    zIndex: 10
                }}>
                    <button 
                        onClick={toggleSidebar} 
                        style={{ 
                            background: 'transparent', 
                            border: '1px solid var(--border)', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            padding: '10px',
                            marginRight: '20px',
                            borderRadius: '8px',
                            color: 'var(--text-h)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                            e.currentTarget.style.borderColor = 'var(--accent)';
                            e.currentTarget.style.color = 'var(--accent)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.color = 'var(--text-h)';
                        }}
                    >
                        <Menu size={20} />
                    </button>
                    {(!isSidebarOpen || isMobile) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity color="var(--accent)" size={20} />
                            <h2 style={{ color: 'var(--text-h)', fontWeight: '800', margin: 0, fontSize: '18px' }}>
                                Aloi.<span style={{ color: 'var(--accent)', textShadow: 'var(--shadow-neon)' }}>CORE</span>
                            </h2>
                        </div>
                    )}
                </header>

                {/* Conteúdo Injetado Pelo Rotas */}
                <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                    <Outlet />
                </div>
            </main>

        </div>
    );
}