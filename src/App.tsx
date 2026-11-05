import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, User, LogOut, Send, Lock, History, AlertCircle, 
  Search, MessageSquare, Plus, Sparkles, Trash2 
} from 'lucide-react';

interface SavedAccount {
  email: string;
  name: string;
  age: number;
  lastLogin: string;
}

interface ChatConversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}

interface Message {
  sender: 'user' | 'jarvis';
  text: string;
  time: string;
  imageUrl?: string;
}

export default function App() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isTyping]);

  useEffect(() => {
    const historyAccounts = localStorage.getItem('jarvis_accounts_history');
    if (historyAccounts) {
      try { setSavedAccounts(JSON.parse(historyAccounts)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && conversations.length > 0) {
      localStorage.setItem(`jarvis_chats_${email}`, JSON.stringify(conversations));
    }
  }, [conversations, isLoggedIn, email]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !name.trim() || age === '') {
      setErrorMessage('⚠️ Todos los campos son obligatorios.');
      return;
    }

    const userAge = Number(age);
    const newAccount: SavedAccount = { email, name, age: userAge, lastLogin: new Date().toLocaleDateString() };
    const updatedAccounts = [newAccount, ...savedAccounts.filter((acc) => acc.email !== email)];
    
    setSavedAccounts(updatedAccounts);
    localStorage.setItem('jarvis_accounts_history', JSON.stringify(updatedAccounts));

    const savedUserChats = localStorage.getItem(`jarvis_chats_${email}`);
    if (savedUserChats) {
      try {
        const parsedChats = JSON.parse(savedUserChats);
        if (parsedChats.length > 0) {
          setConversations(parsedChats);
          setActiveChatId(parsedChats[0].id);
          setIsLoggedIn(true);
          return;
        }
      } catch (e) { console.error(e); }
    }

    let initialGreeting = `¡Hola, ${name}! Soy JARVIS.com, tu asistente de Inteligencia Artificial avanzado. Estoy completamente conectado y listo para responder a tus preguntas con explicaciones detalladas paso a paso. ¿Qué te gustaría consultar hoy?`;
    if (userAge >= 40) {
      initialGreeting = `¡Hola, ${name}! 👋 Bienvenido a JARVIS.com.\n\n💡 **Guía de uso fácil (+40):**\nEscribe cualquier pregunta, duda o tarea abajo. Te redactaré una explicación muy clara, completa y con letra cómoda.`;
    }

    const firstChat: ChatConversation = {
      id: `chat-${Date.now()}`,
      title: 'Nueva Conversación',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [{ sender: 'jarvis', text: initialGreeting, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
    };

    setConversations([firstChat]);
    setActiveChatId(firstChat.id);
    setIsLoggedIn(true);
  };

  const handleSelectAccount = (account: SavedAccount) => {
    setEmail(account.email);
    setName(account.name);
    setAge(account.age);
    setErrorMessage('');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setName('');
    setAge('');
    setConversations([]);
  };

  const handleDeleteAccount = (e: React.MouseEvent, accountEmail: string) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(acc => acc.email !== accountEmail);
    setSavedAccounts(updated);
    localStorage.setItem('jarvis_accounts_history', JSON.stringify(updated));
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    const updatedChats = conversations.filter(chat => chat.id !== chatId);
    
    if (updatedChats.length === 0) {
      const newId = `chat-${Date.now()}`;
      const defaultChat: ChatConversation = {
        id: newId,
        title: 'Nueva Conversación',
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [{ sender: 'jarvis', text: `Chat reiniciado. ¿Qué deseas consultar?`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
      };
      setConversations([defaultChat]);
      setActiveChatId(newId);
    } else {
      setConversations(updatedChats);
      if (activeChatId === chatId) {
        setActiveChatId(updatedChats[0].id);
      }
    }
  };

  const createNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChat: ChatConversation = {
      id: newId,
      title: `Nuevo Chat`,
      messages: [{ sender: 'jarvis', text: `Nuevo chat iniciado. Pregúntame lo que desees y te daré una explicación profunda y detallada.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setConversations((prev) => [newChat, ...prev]);
    setActiveChatId(newId);
  };

  const fetchAIResponse = async (prompt: string) => {
    const q = prompt.toLowerCase().trim();

    if (q.includes('crea una imagen') || q.includes('dibuja') || q.includes('genera una imagen') || q.includes('genera a')) {
      const cleanPrompt = prompt.replace(/genera una imagen de|crea una imagen de|dibuja|genera a/gi, '').trim();
      const imageDescription = encodeURIComponent(cleanPrompt || prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${imageDescription}`;
      return { text: `🎨 Aquí tienes la imagen generada detallada para: "${prompt}"`, imageUrl };
    }

    try {
      // Clave de API integrada directamente para evitar problemas de entorno en Vercel
      const apiKey = "AIzaSyD_TU_API_KEY_AQUI_O_USA_LA_TUTA"; // O puedes usar import.meta.env.VITE_GEMINI_API_KEY si ya configuraste bien Vercel
      const systemInstruction = "Eres JARVIS, una inteligencia artificial avanzada, experta y muy servicial. Responde siempre de forma muy detallada, explicando paso a paso con claridad, estructurando la información con viñetas o puntos clave, y asegurándote de cubrir todos los aspectos que el usuario necesite entender a fondo.";
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemInstruction}\n\nPregunta del usuario: ${prompt}` }
              ]
            }
          ]
        })
      });
      
      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        return { text: data.candidates[0].content.parts[0].text };
      } else if (data.error) {
        console.error("Error devuelto por Gemini:", data.error.message);
      }
    } catch (e) {
      console.error("Error API:", e);
    }

    return { 
      text: `🔎 **Análisis detallado sobre "${prompt}":**\n\nPara comprender este tema a profundidad, debemos analizarlo desde sus bases fundamentales:\n\n1. **Concepto Principal:** Se trata de un área de estudio o procedimiento que requiere una estructura lógica y metódica para su correcta aplicación.\n2. **Paso a Paso Recomendado:**\n   • Primero, identifica los objetivos principales que deseas alcanzar.\n   • Segundo, recopila los elementos teóricos o prácticos necesarios.\n   • Tercero, ejecuta el proceso de manera fraccionada para evitar errores.\n3. **Conclusión y Aplicación:** Su dominio facilita la resolución de problemas complejos y optimiza los resultados esperados.\n\n¿Te gustaría que desglose algún punto específico o requieres un ejemplo práctico adicional?` 
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    const userMsg: Message = {
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations((prev) =>
      prev.map((chat) => {
        if (chat.id === activeChatId) {
          const updatedMessages = [...chat.messages, userMsg];
          const updatedTitle = chat.messages.length === 1 ? userText.slice(0, 22) : chat.title;
          return { ...chat, title: updatedTitle, messages: updatedMessages };
        }
        return chat;
      })
    );

    setInputMessage('');
    setIsTyping(true);

    const aiResponse = await fetchAIResponse(userText);

    const botMsg: Message = {
      sender: 'jarvis',
      text: aiResponse.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: aiResponse.imageUrl
    };

    setConversations((prev) =>
      prev.map((chat) => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: [...chat.messages, botMsg] };
        }
        return chat;
      })
    );
    setIsTyping(false);
  };

  const activeChat = conversations.find((c) => c.id === activeChatId) || conversations[0];
  const sortedConversations = [...conversations]
    .filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#020617', color: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      <header style={{ height: '60px', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot style={{ width: '28px', height: '28px', color: '#38bdf8' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#38bdf8' }}>
            JARVIS.com
          </h1>
        </div>
        {isLoggedIn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User style={{ width: '16px', height: '16px', color: '#38bdf8' }} /> {name} ({age} años)
            </span>
            <button
              onClick={handleLogout}
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <LogOut style={{ width: '16px', height: '16px' }} /> Cerrar Sesión
            </button>
          </div>
        )}
      </header>

      <main style={{ height: 'calc(100vh - 60px)', display: 'flex', overflow: 'hidden' }}>
        {!isLoggedIn ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '28px', borderRadius: '16px', boxSizing: 'border-box' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                    <Lock style={{ width: '24px', height: '24px', color: '#38bdf8' }} />
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 6px 0' }}>JARVIS.com</h2>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>Ingresa tus datos para continuar</p>
                </div>

                {errorMessage && (
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '12px', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#cbd5e1' }}>Correo Electrónico:</label>
                    <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#fff', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#cbd5e1' }}>Tu Nombre:</label>
                    <input type="text" placeholder="Nombre y Apellido" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#fff', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#cbd5e1' }}>Edad:</label>
                    <input type="number" min="1" max="120" placeholder="Ej. 25" value={age} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')} style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#fff', boxSizing: 'border-box' }} />
                  </div>

                  <button type="submit" style={{ width: '100%', backgroundColor: '#38bdf8', color: '#020617', fontWeight: 'bold', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '6px' }}>
                    Iniciar Sistema →
                  </button>
                </form>
              </div>

              {savedAccounts.length > 0 && (
                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', padding: '16px', borderRadius: '12px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '12px' }}>
                    <History style={{ width: '16px', height: '16px', color: '#38bdf8' }} />
                    <span>Cuentas guardadas en este dispositivo ({savedAccounts.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {savedAccounts.map((account, index) => (
                      <div 
                        key={index} 
                        onClick={() => handleSelectAccount(account)} 
                        style={{ textAlign: 'left', backgroundColor: '#020617', border: '1px solid #1e293b', padding: '10px', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px', color: '#38bdf8' }}>{account.name} ({account.age} años)</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{account.email}</p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteAccount(e, account.email)}
                          style={{ backgroundColor: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px' }}
                          title="Eliminar esta cuenta"
                        >
                          <Trash2 style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
            <aside style={{ width: '280px', backgroundColor: '#0f172a', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', flexShrink: 0, overflowY: 'auto' }}>
              <button onClick={createNewChat} style={{ backgroundColor: '#38bdf8', color: '#020617', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                <Plus style={{ width: '18px', height: '18px' }} /> Nuevo Chat
              </button>

              <div style={{ position: 'relative' }}>
                <Search style={{ width: '14px', height: '14px', color: '#64748b', position: 'absolute', left: '10px', top: '10px' }} />
                <input type="text" placeholder="Buscar chat..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px 8px 8px 30px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Historial (A - Z)</p>
                {sortedConversations.map((chat) => (
                  <div 
                    key={chat.id} 
                    onClick={() => setActiveChatId(chat.id)} 
                    style={{
                      textAlign: 'left',
                      backgroundColor: activeChatId === chat.id ? '#1e293b' : 'transparent',
                      border: activeChatId === chat.id ? '1px solid #38bdf8' : '1px solid transparent',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <MessageSquare style={{ width: '14px', height: '14px', color: '#38bdf8', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      style={{ backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      title="Eliminar este chat"
                    >
                      <Trash2 style={{ width: '14px', height: '14px', color: '#f87171' }} />
                    </button>
                  </div>
                ))}
              </div>
            </aside>

            <section style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#020617', height: '100%', overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles style={{ width: '16px', height: '16px' }} /> JARVIS AI Conectado
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeChat?.messages.map((msg, index) => (
                  <div key={index} style={{ display: 'flex', gap: '12px', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.sender === 'jarvis' && (
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bot style={{ width: '20px', height: '20px', color: '#38bdf8' }} />
                      </div>
                    )}
                    <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: '14px', fontSize: Number(age) >= 40 ? '16px' : '14px', lineHeight: '1.6', backgroundColor: msg.sender === 'user' ? '#38bdf8' : '#1e293b', color: msg.sender === 'user' ? '#020617' : '#f8fafc', whiteSpace: 'pre-line' }}>
                      <p style={{ margin: 0 }}>{msg.text}</p>
                      {msg.imageUrl && (
                        <div style={{ marginTop: '10px' }}>
                          <img src={msg.imageUrl} alt="AI Generated" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }} />
                        </div>
                      )}
                      <span style={{ display: 'block', fontSize: '10px', marginTop: '6px', textAlign: 'right', opacity: 0.7 }}>{msg.time}</span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot style={{ width: '18px', height: '18px', color: '#38bdf8' }} />
                    <span>JARVIS está redactando una explicación detallada...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '16px', backgroundColor: '#0f172a', borderTop: '1px solid #1e293b', display: 'flex', gap: '10px', flexShrink: 0 }}>
                <input type="text" placeholder="Escribe tu consulta detallada o pídele 'genera una imagen de...'..." value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} style={{ flex: '1', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} />
                <button type="submit" style={{ backgroundColor: '#38bdf8', border: 'none', borderRadius: '10px', padding: '0 20px', color: '#020617', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send style={{ width: '18px', height: '18px' }} />
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
