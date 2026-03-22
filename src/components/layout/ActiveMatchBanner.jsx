import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchmakingApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { onWS } from '../../services/websocket';
import { Swords } from 'lucide-react';

/**
 * Bannière persistante affichée sur toutes les pages quand un match est en cours.
 * Uniquement visible pour les joueurs participant au match.
 */
export default function ActiveMatchBanner() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeMatch, setActiveMatch] = useState(null);

  const fetchActive = async () => {
    try {
      const { data } = await matchmakingApi.activeMatch();
      setActiveMatch(data.match || null);
    } catch {
      setActiveMatch(null);
    }
  };

  useEffect(() => {
    if (!user) { setActiveMatch(null); return; }
    fetchActive();

    // Quand un match est trouvé via WS → afficher la bannière
    const offFound = onWS('MATCH_FOUND', (data) => {
      setActiveMatch({ id: data.matchId, mode: data.mode, queueType: data.queueType, status: 'IN_PROGRESS' });
    });

    // Quand le match se termine → masquer la bannière
    const offResult = onWS('MATCH_RESULT', () => {
      setActiveMatch(null);
    });

    const offDisputed = onWS('MATCH_DISPUTED', () => {
      fetchActive();
    });

    // Polling léger toutes les 30s en cas de désynchronisation
    const interval = setInterval(fetchActive, 30_000);

    return () => {
      offFound();
      offResult();
      offDisputed();
      clearInterval(interval);
    };
  }, [user]);

  if (!user || !activeMatch) return null;

  const modeLabel = activeMatch.mode === 'TWO_V_TWO' ? '2v2' : '5v5';

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div
        className="flex items-center gap-3 bg-dark-200 border border-yellow-500/40 shadow-glow-yellow rounded-xl px-4 py-3 cursor-pointer hover:border-yellow-500/70 transition-all"
        onClick={() => navigate(`/match/${activeMatch.id}`)}
      >
        {/* Indicateur pulsant */}
        <div className="relative">
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <div className="absolute inset-0 w-3 h-3 bg-yellow-500 rounded-full animate-ping opacity-75" />
        </div>

        <div>
          <div className="text-xs text-yellow-500 font-bold uppercase tracking-wide">Match en cours</div>
          <div className="text-xs text-gray-400">{modeLabel} · Cliquez pour rejoindre</div>
        </div>

        <Swords size={18} className="text-yellow-500" />
      </div>
    </div>
  );
}
