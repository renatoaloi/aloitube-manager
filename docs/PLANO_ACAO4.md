# 📚 Roteiro da Aula (Parte 4): A Ponte Front-End com React & Vite

## 🎯 Objetivo
Nesta aula, sairemos da tela preta da linha de comando do Python. Vamos montar um painel rico de gerenciamento (Dashboard) construído nos padrões visuais modernos.
O seu sistema vai contar com uma *Sidebar* contínua, Navegação Dinâmica via React Router, e uma separação cirúrgica entre o React (5173) e o FastAPI (8000), usando nossa classe "Wrapper" de comunicação para jamais cruzarmos domínios problemáticos (CORS ou perdas de contexto de autenticação).

---

## 🛠️ Etapa 17: O Setup Supersônico do Vite

Peça para os alunos abrirem uma aba *limpa* no Terminal. Vamos criar a pasta do cliente:

```bash
# 1. Cria o esqueleto do React puro numa velocidade absurda
npm create vite@latest frontend -- --template react

# 2. Entra na pasta que o vite criou
cd frontend

# 3. Instala as dependências vitais de produção
npm install
npm install react-router-dom axios lucide-react
```
*(Dica de fala: `lucide-react` servirá para termos ícones lindos, `axios` para o Wrapper de API bater no Python e `react-router-dom` para transitar entre Login/Home de forma fluída).*

---

## 🔌 Etapa 18: O Wrapper de Comunicação e Autenticação (A Classe Mestra)

O maior erro dos novatos de React + Python é fazer requisições cruas por cada componente separadamente. Isso vira um inferno de "Mixing Context". Como nosso Python roda engessado via `127.0.0.1:8000`, montamos o Wrapper que aponta eternamente pra ele.

Crie `src/services/api.js`:
```javascript
import axios from 'axios';

// O "Engarrafador". Toda chamada ou verificação oficial ao Python passa daqui.
// Fixa o Header de Content-Type e amarra a BaseURL cravada!
export const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json'
    }
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
    }
};
```

---

## 🎨 Etapa 19: O Layout Autenticado (Sidebar Persistente)

No Dashboard de Software, você precisa de uma "Casca". O usuário entra, tem a barra lateral que não desaparece, e as páginas (`Home`, `Videos`) apenas trocam de recheio pelo `Outlet`.

Crie `src/components/SidebarLayout.jsx`:
```jsx
import { Outlet, Link } from 'react-router-dom';
import { Home, Video, Settings } from 'lucide-react';

export default function SidebarLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9f9f9', fontFamily: 'sans-serif' }}>
      
      {/* Menu Lateral Estilo YouTube Studio */}
      <aside style={{ width: '250px', backgroundColor: '#fff', borderRight: '1px solid #ddd', padding: '20px' }}>
        <h2 style={{ color: '#FF0000', fontWeight: 'bold', marginBottom: '30px', letterSpacing: '-1px' }}>AloiTube IA</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Link to="/home" style={{ textDecoration: 'none', color: '#444', display: 'flex', gap: '10px' }}>
            <Home size={20} /> Boas-Vindas
          </Link>
          <Link to="/videos" style={{ textDecoration: 'none', color: '#444', display: 'flex', gap: '10px' }}>
            <Video size={20} /> Meus Vídeos
          </Link>
          <Link to="#" style={{ textDecoration: 'none', color: '#aaa', display: 'flex', gap: '10px', marginTop: 'auto' }}>
            <Settings size={20} /> Configurações
          </Link>
        </nav>
      </aside>

      {/* O Recheio do Sanduíche (O React Router injeta a página respectiva aqui) */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <Outlet /> 
      </main>

    </div>
  );
}
```

---

## 🔐 Etapa 20: A Tela de Boas Vindas e Login 

A porta de entrada. Um container limpo para engatilhar a Autenticação do FastAPI.

Crie `src/pages/Login.jsx`:
```jsx
export default function Login() {
  
  // A ponte de Ouro: O botão joga o peso das chaves OAuth nas costas do Back-End!
  const entrarGoogle = () => {
    window.location.href = "http://127.0.0.1:8000/auth/login/aloitech";
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1A1A1A' }}>
      <div style={{ background: '#2C2C2C', padding: '50px 70px', borderRadius: '12px', textAlign: 'center', color: 'white' }}>
        <h1 style={{ marginBottom: '10px', fontSize: '32px' }}>Gestão Algorítmica</h1>
        <p style={{ marginBottom: '30px', color: '#aaa', maxWidth: '350px' }}>Conecte seu Dashboard a inteligência artificial do seu Backend FastAPI.</p>
        
        <button 
          onClick={entrarGoogle}
          style={{ width: '100%', padding: '16px', background: '#3EA6FF', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
          Conectar Canal Principal
        </button>
      </div>
    </div>
  );
}
```

---

## 📺 Etapa 21: A Tela de Vídeos Mockada ("Content Manager")

Onde a inteligência do banco de dados (que fizemos nas partes 1 e 2) irá florescer fisicamente para o aluno.

Crie `src/pages/Videos.jsx`:
```jsx
export default function Videos() {
  // Os dados de Mock que na Parte 5 nós substituiremos pelo Wrapper (api.get)
  const fakeVideos = [
    { id: 101, titulo: "Como instalar Python em 2026", ia_status: "Processando", views: "1.2K", thumb: "https://picsum.photos/seed/py/300/170" },
    { id: 102, titulo: "Segredos da Inteligência Artificial", ia_status: "Concluído", views: "24.5K", thumb: "https://picsum.photos/seed/ai/300/170" },
    { id: 103, titulo: "Automação com FastAPI + SQLite", ia_status: "Pendente", views: "18", thumb: "https://picsum.photos/seed/db/300/170" }
  ];

  return (
    <div>
      <h1 style={{ fontSize: '28px', marginBottom: '30px', color: '#111' }}>Catálogo do Canal</h1>
      
      {/* Grid Dinâmico Flexível */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
        
        {fakeVideos.map(vid => (
          <div key={vid.id} style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <img src={vid.thumb} alt="Video Thumbnail" style={{ width: '100%', display: 'block' }} />
            
            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '17px', margin: '0 0 10px 0', color: '#222' }}>{vid.titulo}</h3>
              <p style={{ margin: '0', fontSize: '13px', color: '#777', fontWeight: '500' }}>👁️ {vid.views} visualizações</p>
              
              <div style={{ margin: '20px 0 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '11px', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', textTransform: 'uppercase',
                  background: vid.ia_status === 'Concluído' ? '#E6FFCC' : (vid.ia_status === 'Processando' ? '#FFF3CD' : '#F1F1F1'),
                  color: vid.ia_status === 'Concluído' ? '#2F6600' : (vid.ia_status === 'Processando' ? '#855A00' : '#555')
                }}>
                  Robô: {vid.ia_status}
                </span>
                
                <button style={{ border: 'none', background: '#F00', color: '#fff', padding: '7px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Gerar Títulos IA
                </button>
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
```

---

## 🚦 Etapa 22: O Liquidificador do React (App.jsx)

O ponto onde dizemos como o roteamento entre as páginas limpas e as páginas encapsuladas opera. Abra seu `src/App.jsx` vazio do Vite e monte:

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SidebarLayout from './components/SidebarLayout';
import Videos from './pages/Videos';

// Página Simples apenas didática
function Home() {
  return (
    <div>
      <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Olá, Comandante! 🚀</h1>
      <p style={{ color: '#555' }}>Sua interface algorítmica está ciente e conectada. Clique em "Meus Vídeos" para acompanhar a operação do Backend.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Rota Raiz (Aberta) - Sem menu lateral */}
        <Route path="/" element={<Login />} />

        {/* Rotas Agrupadas: Para entrar aqui, a Casca (SidebarLayout) embrulha o resultado */}
        <Route element={<SidebarLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/videos" element={<Videos />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}
```

> 💡 **Cereja do Bolo:** Explique no seu vídeo por que utilizamos *inline styles* puristas nessa aula. No Front-end, não perder tempo com folhas de estilo separadas inicialmente ajuda o cérebro do iniciante a entender a "árvore" dos componentes. 
> Quando você mostrar a tela rodando `npm run dev` e arrastar a aba "Meus Vídeos", comente da sensação fantástica de usar Single Page Applications modernas!
