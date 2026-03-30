export default function Login() {

    // A ponte de Ouro: O botão joga o peso das chaves OAuth nas costas do Back-End!
    const entrarGoogle = () => {
        window.location.href = "http://127.0.0.1:8000/auth/login/aloitech";
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg)', padding: '20px' }}>
            <div className="glass-panel" style={{ padding: '60px 50px', borderRadius: '12px', textAlign: 'center', maxWidth: '450px', width: '100%' }}>
                <h1 style={{ marginBottom: '15px', fontSize: '36px', color: 'var(--accent)', textShadow: 'var(--shadow-neon)' }}>Aloi.CORE</h1>
                <p style={{ marginBottom: '40px', color: 'var(--text)', fontSize: '16px', lineHeight: '1.6' }}>Conecte sua Interface Algorítmica ao Backend FastAPI e inicie a Gestão de Ativos.</p>

                <button
                    onClick={entrarGoogle}
                    style={{ 
                        width: '100%', 
                        padding: '16px', 
                        background: 'var(--accent)', 
                        border: 'none', 
                        borderRadius: '6px', 
                        color: 'var(--bg)', 
                        fontWeight: '800', 
                        fontSize: '16px', 
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        boxShadow: '0 4px 15px var(--accent-glow)'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'var(--accent-hover)';
                        e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'var(--accent)';
                        e.target.style.transform = 'translateY(0)';
                    }}>
                    Sincronizar Canal Primário
                </button>
            </div>
        </div>
    );
}