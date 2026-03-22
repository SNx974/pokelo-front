import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchesApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { onWS } from '../../services/websocket';
import { Gamepad2, Check, X, UserCheck } from 'lucide-react';
import { SiPokemon } from '@icons-pack/react-simple-icons';

/**
 * Overlay plein écran qui apparaît quand un match PENDING est trouvé.
 * Compte à rebours de 30s — accepter ou refuser.
 */
export default function MatchAcceptOverlay() {
  const [pendingMatch, setPendingMatch] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading]   = useState(false);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Charge le match PENDING au montage
  useEffect(() => {
    matchesApi.getPending()
      .then(({ data }) => {
        if (data.match) startPending(data.match);
      })
      .catch(() => {});
  }, []);

  const startPending = useCallback((match) => {
    setPendingMatch(match);
    // Calcule le temps restant depuis expiresAt
    const expiresAt = match.acceptExpiresAt ? new Date(match.acceptExpiresAt).getTime() : Date.now() + 30_000;
    const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
    setTimeLeft(remaining);
    const alreadyAccepted = match.acceptances?.filter(a => a.accepted === true).length || 0;
    setAcceptedCount(alreadyAccepted);
  }, []);

  // Écoute les événements WS
  useEffect(() => {
    const offFound = onWS('MATCH_FOUND', (data) => {
      // Recharge le match depuis l'API pour avoir les infos complètes
      matchesApi.getPending()
        .then(({ data: d }) => { if (d.match) startPending(d.match); })
        .catch(() => {});
    });

    const offUpdate = onWS('MATCH_ACCEPT_UPDATE', (data) => {
      if (pendingMatch && data.matchId === pendingMatch.id) {
        setAcceptedCount(c => c + 1);
      }
    });

    const offStarted = onWS('MATCH_STARTED', (data) => {
      setPendingMatch(null);
      navigate(`/match/${data.matchId}`);
    });

    const offCancelled = onWS('MATCH_CANCELLED', (data) => {
      if (pendingMatch && data.matchId === pendingMatch.id) {
        setPendingMatch(null);
      }
    });

    return () => { offFound(); offUpdate(); offStarted(); offCancelled(); };
  }, [pendingMatch, startPending, navigate]);

  // Compte à rebours
  useEffect(() => {
    if (!pendingMatch) return;
    if (timeLeft <= 0) { setPendingMatch(null); return; }

    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [pendingMatch, timeLeft]);

  const handleAccept = async () => {
    if (!pendingMatch || loading) return;
    setLoading(true);
    try {
      await matchesApi.accept(pendingMatch.id);
    } catch {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!pendingMatch || loading) return;
    setLoading(true);
    try {
      await matchesApi.decline(pendingMatch.id);
      setPendingMatch(null);
    } catch {
      setLoading(false);
    }
  };

  if (!pendingMatch) return null;

  const totalPlayers = pendingMatch.participants?.length || 0;
  const team1 = pendingMatch.participants?.filter(p => p.team === 1) || [];
  const team2 = pendingMatch.participants?.filter(p => p.team === 2) || [];
  const mySide = pendingMatch.participants?.find(p => p.userId === user?.id)?.team;
  const myAcceptance = pendingMatch.acceptances?.find(a => a.userId === user?.id);
  const alreadyResponded = myAcceptance?.accepted !== null && myAcceptance?.accepted !== undefined;

  const pct = (timeLeft / 30) * 100;
  const color = timeLeft > 15 ? '#22c55e' : timeLeft > 8 ? '#f59e0b' : '#ef4444';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{ background: '#0d1f3c', border: '2px solid rgba(255,203,5,0.4)', boxShadow: '0 0 60px rgba(255,203,5,0.15)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <SiPokemon size={36} style={{ color: '#FFCB05' }} />
          </div>
          <h2 className="font-bebas text-3xl tracking-wider" style={{ color: '#FFCB05' }}>MATCH TROUVÉ !</h2>
          <p className="text-gray-400 text-sm mt-1">{pendingMatch.mode?.replace('_', ' ')} — {pendingMatch.queueType}</p>
        </div>

        {/* Timer */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Temps restant</span>
            <span className="font-bold tabular-nums" style={{ color }}>{timeLeft}s</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: color, transition: 'width 1s linear, background 0.3s' }}
            />
          </div>
        </div>

        {/* Teams */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'Équipe 1', players: team1, side: 1 }, { label: 'Équipe 2', players: team2, side: 2 }].map(({ label, players, side }) => (
              <div key={side} className="rounded-xl p-3" style={{ background: mySide === side ? 'rgba(255,203,5,0.08)' : 'rgba(255,255,255,0.04)', border: mySide === side ? '1px solid rgba(255,203,5,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold text-gray-400 mb-2">{label} {mySide === side && <span style={{ color: '#FFCB05' }}>(vous)</span>}</p>
                {players.map(p => (
                  <div key={p.userId} className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FFCB05' }} />
                    <span className="text-xs text-gray-300">{p.user?.username}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Acceptances progress */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 text-center">
            {acceptedCount}/{totalPlayers} joueurs ont accepté
          </p>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6">
          {alreadyResponded ? (
            <div className="text-center py-3 rounded-xl text-sm font-semibold text-gray-400" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {myAcceptance?.accepted
                ? <span className="flex items-center justify-center gap-1.5"><UserCheck size={14} className="text-green-400" /> Vous avez accepté — en attente...</span>
                : <span className="flex items-center justify-center gap-1.5"><X size={14} className="text-red-400" /> Vous avez refusé</span>
              }
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}
              >
                Refuser
              </button>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-2 flex-1 py-3 rounded-xl font-bold text-sm text-gray-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#FFCB05', flexGrow: 2 }}
              >
                {loading ? <Gamepad2 size={15} className="animate-pulse" /> : <><Check size={15} /> Accepter</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
