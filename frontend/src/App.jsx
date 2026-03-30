// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ModalProvider } from './components/GlobalModal';
import Login from './pages/Login';
import SidebarLayout from './components/SidebarLayout';
import Videos from './pages/Videos';
import Downloads from './pages/Downloads';
import Extracoes from './pages/Extracoes';
import Transcricoes from './pages/Transcricoes';
import Titulos from './pages/Titulos';

// Página Simples apenas didática
function Home() {
  return (
    <div>
      <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Olá, Comandante! 🚀</h1>
      <p style={{ color: 'var(--text)' }}>Sua interface algorítmica está ciente e conectada. Clique em "Meus Vídeos" para acompanhar a operação do Backend.</p>
    </div>
  );
}

export default function App() {
  return (
    <ModalProvider>
      <BrowserRouter>
        <Routes>

          {/* Rota Raiz (Aberta) - Sem menu lateral */}
          <Route path="/" element={<Login />} />

          {/* Rotas Agrupadas: Para entrar aqui, a Casca (SidebarLayout) embrulha o resultado */}
          <Route element={<SidebarLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/extracoes" element={<Extracoes />} />
            <Route path="/transcricoes" element={<Transcricoes />} />
            <Route path="/titulos" element={<Titulos />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </ModalProvider>
  );
}