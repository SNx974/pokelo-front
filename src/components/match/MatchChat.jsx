import { useEffect, useRef, useState } from 'react';
import { matchesApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { onWS, sendWS } from '../../services/websocket';
import Avatar from '../ui/Avatar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Chat en temps réel pour les participants d'un match.
 */
export default function MatchChat({ matchId }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Charger l'historique + rejoindre la room WS
  useEffect(() => {
    matchesApi.getChatMessages(matchId).then(r => setMessages(r.data)).catch(() => {});

    // Rejoindre la room WS du match
    sendWS({ type: 'JOIN_MATCH', matchId });

    // Écouter les nouveaux messages
    const off = onWS('CHAT_MESSAGE', (data) => {
      if (data.matchId === matchId) {
        setMessages(prev => {
          // Évite les doublons si le message vient de soi-même via REST + WS
          const exists = prev.some(m => m.id === data.message.id);
          if (exists) return prev;
          return [...prev, data.message];
        });
      }
    });

    return () => {
      off();
      sendWS({ type: 'LEAVE_MATCH', matchId });
    };
  }, [matchId]);

  // Scroll automatique vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      await matchesApi.sendChatMessage(matchId, input.trim());
      setInput('');
    } catch {
      // L'erreur est déjà gérée par l'intercepteur axios
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="card flex flex-col" style={{ height: '420px' }}>
      <div className="p-4 border-b border-dark-300/50">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <span>💬</span> Chat du match
          <span className="text-xs text-gray-500 font-normal">(participants uniquement)</span>
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 text-sm py-8">Aucun message. Soyez le premier !</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.userId === user?.id;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <Avatar src={msg.user?.avatarUrl} username={msg.user?.username} size={28} />
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                <span className={`text-xs text-gray-500 ${isMe ? 'text-right' : 'text-left'}`}>
                  {isMe ? 'Vous' : msg.user?.username}
                </span>
                <div className={`rounded-xl px-3 py-2 text-sm break-words ${
                  isMe
                    ? 'bg-yellow-500/20 text-yellow-100 rounded-tr-sm'
                    : 'bg-dark-300 text-gray-200 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-xs text-gray-600">
                  {format(new Date(msg.createdAt), 'HH:mm', { locale: fr })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-dark-300/50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrire un message..."
          maxLength={500}
          className="input flex-1 text-sm py-2"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
        >
          ↑
        </button>
      </form>
    </div>
  );
}
