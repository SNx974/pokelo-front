import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMatchmakingStore } from '../store/matchmakingStore';
import { useAuthStore } from '../store/authStore';
import { matchmakingApi, teamsApi } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import RankBadge from '../components/ui/RankBadge';
import { User, Users, Swords, Gamepad2, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const MODES = [
  { id: 'TWO_V_TWO',   label: '2v2', Icon: Swords,   desc: 'Équipe de 2 joueurs. Parties rapides et intenses.' },
  { id: 'FIVE_V_FIVE', label: '5v5', Icon: Gamepad2,  desc: 'Équipe de 5 joueurs. Le format compétitif principal.' },
];
const QUEUE_TYPES = [
  { id: 'SOLO', label: 'Solo Queue', Icon: User,  desc: 'Jouez seul, soyez groupé avec d\'autres joueurs.' },
  { id: 'TEAM', label: 'Team Queue', Icon: Users, desc: 'Jouez avec votre équipe. Nécessite une équipe.' },
];

function QueueTimer({ seconds }) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return <span className="font-mono text-2xl font-bold text-yellow-500">{m}:{s}</span>;
}

export default function Matchmaking() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    inQueue, queueEntry, waitTime, matchFound, queueInfo,
    joinQueue, leaveQueue, fetchQueueInfo, checkStatus, reset,
  } = useMatchmakingStore();

  const [selectedMode, setSelectedMode] = useState('TWO_V_TWO');
  const [selectedType, setSelectedType] = useState('SOLO');
  const [joining, setJoining] = useState(false);
  const [activeMatch, setActiveMatch] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [teamOnline, setTeamOnline] = useState({});

  // Chargement du statut online de l'équipe active (selon le mode sélectionné)
  const refreshTeamOnline = useCallback(() => {
    const teamId = myTeam?.[selectedMode]?.team?.id;
    if (teamId) {
      teamsApi.onlineStatus(teamId)
        .then(({ data }) => setTeamOnline(data))
        .catch(() => {});
    }
  }, [myTeam, selectedMode]);

  useEffect(() => {
    checkStatus();
    fetchQueueInfo();
    const interval = setInterval(fetchQueueInfo, 10000);

    // Vérifie si le joueur a un match en cours
    matchmakingApi.activeMatch().then(r => setActiveMatch(r.data.match)).catch(() => {});
    // Charge les équipes du joueur
    teamsApi.my().then(r => setMyTeam(r.data)).catch(() => {});

    return () => clearInterval(interval);
  }, []);

  // Équipe du mode sélectionné (myTeam est maintenant { TWO_V_TWO: ..., FIVE_V_FIVE: ... })
  const currentTeamEntry = selectedType === 'TEAM' ? myTeam?.[selectedMode] : null;
  const currentTeam = currentTeamEntry?.team || null;

  // Rafraîchit le statut online quand on passe en Team Queue
  useEffect(() => {
    if (selectedType === 'TEAM' && currentTeam) {
      refreshTeamOnline();
      const iv = setInterval(refreshTeamOnline, 10_000);
      return () => clearInterval(iv);
    }
  }, [selectedType, currentTeam?.id, refreshTeamOnline]);

  useEffect(() => {
    if (matchFound) {
      setTimeout(() => { navigate(`/match/${matchFound.matchId}`); reset(); }, 3000);
    }
  }, [matchFound, navigate, reset]);

  const handleJoin = async () => {
    setJoining(true);
    const teamId = selectedType === 'TEAM' ? currentTeam?.id : null;
    const res = await joinQueue(selectedMode, selectedType, teamId);
    setJoining(false);
    if (!res.success) alert(res.error);
  };

  const getRank = (elo) => {
    if (elo < 900)  return { name: 'Rookie', icon: '🥚' };
    if (elo < 1100) return { name: 'Novice', icon: '🐢' };
    if (elo < 1300) return { name: 'Pokéfan', icon: '⚡' };
    if (elo < 1500) return { name: 'Entraîneur', icon: '🔥' };
    if (elo < 1700) return { name: 'Expert', icon: '💎' };
    if (elo < 1900) return { name: 'Master', icon: '🌟' };
    if (elo < 2100) return { name: 'Champion', icon: '👑' };
    if (elo < 2300) return { name: 'Grand Master', icon: '🏆' };
    return { name: 'Légende', icon: '🌌' };
  };

  // Blocage si match actif
  if (activeMatch) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="card p-10">
          <div className="text-6xl mb-4">⚔️</div>
          <h2 className="font-display font-bold text-2xl text-yellow-500 mb-2">Match en cours</h2>
          <p className="text-gray-400 mb-6">
            Vous avez déjà un match en cours. Terminez-le avant de rejoindre la file d'attente.
          </p>
          <Link to={`/match/${activeMatch.id}`} className="btn-primary inline-block px-8">
            Rejoindre mon match
          </Link>
        </div>
      </div>
    );
  }

  // Match found screen
  if (matchFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="text-8xl mb-6 animate-bounce">⚔️</div>
          <h1 className="font-display font-bold text-4xl text-yellow-500 mb-2">Match Trouvé !</h1>
          <p className="text-gray-400 mb-4">Redirection vers le match...</p>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // In queue screen
  if (inQueue) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="card p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-card opacity-50" />
          <div className="relative z-10">
            <div className="w-24 h-24 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-6" />
            <h2 className="font-display font-bold text-2xl mb-2">Recherche d'adversaires...</h2>
            <p className="text-gray-400 mb-6">
              {queueEntry?.mode === 'TWO_V_TWO' ? '2v2' : '5v5'} · {queueEntry?.queueType === 'SOLO' ? 'Solo Queue' : 'Team Queue'}
            </p>
            <QueueTimer seconds={waitTime} />
            <p className="text-gray-500 text-sm mt-2">Temps d'attente</p>

            <div className="mt-6 p-4 bg-dark-300/50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Votre profil de matching</p>
              <div className="flex items-center justify-center gap-4">
                <div>
                  <div className="text-sm font-bold text-yellow-500">{selectedMode === 'TWO_V_TWO' ? user?.elo2v2 : user?.elo5v5}</div>
                  <div className="text-xs text-gray-500">Elo</div>
                </div>
                <RankBadge rank={getRank(selectedMode === 'TWO_V_TWO' ? user?.elo2v2 : user?.elo5v5)} />
              </div>
            </div>

            <button onClick={leaveQueue} className="btn-danger mt-6 w-full">
              ✕ Quitter la file
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display font-bold text-4xl mb-2">
          <span className="text-gradient-yellow">Matchmaking</span>
        </h1>
        <p className="text-gray-400">Choisissez votre mode et rejoignez la file d'attente.</p>
      </div>

      {/* Player info */}
      <div className="card p-4 mb-6 flex items-center gap-4">
        <div className="text-2xl">👤</div>
        <div>
          <div className="font-semibold">{user?.username}</div>
          <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
            <span>Global: <span className="text-yellow-500 font-bold">{user?.eloGlobal}</span></span>
            <span>2v2: <span className="text-blue-400 font-bold">{user?.elo2v2}</span></span>
            <span>5v5: <span className="text-blue-400 font-bold">{user?.elo5v5}</span></span>
          </div>
        </div>
      </div>

      {/* Mode selection */}
      <div className="mb-6">
        <h2 className="font-bold mb-3 text-gray-300">1. Choisir le format</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {MODES.map(({ id, label, Icon, desc }) => (
            <button key={id} onClick={() => setSelectedMode(id)}
              className={`card p-5 text-left transition-all border-2 ${selectedMode === id ? 'border-yellow-500 bg-yellow-500/5 shadow-glow-yellow' : 'border-dark-300 hover:border-dark-400'}`}>
              <Icon size={28} className={`mb-2 ${selectedMode === id ? 'text-yellow-500' : 'text-gray-500'}`} />
              <div className="font-bold text-lg">{label}</div>
              <div className="text-sm text-gray-400 mt-1">{desc}</div>
              <div className="mt-3 text-xs text-gray-500">
                En queue: <span className="text-yellow-500 font-bold">{queueInfo[id]?.SOLO + queueInfo[id]?.TEAM || 0}</span> joueurs
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Queue type */}
      <div className="mb-8">
        <h2 className="font-bold mb-3 text-gray-300">2. Type de queue</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {QUEUE_TYPES.map(({ id, label, Icon, desc }) => (
            <button key={id} onClick={() => setSelectedType(id)}
              className={`card p-5 text-left transition-all border-2 ${selectedType === id ? 'border-blue-500 bg-blue-500/5 shadow-glow-blue' : 'border-dark-300 hover:border-dark-400'}`}>
              <Icon size={28} className={`mb-2 ${selectedType === id ? 'text-blue-400' : 'text-gray-500'}`} />
              <div className="font-bold">{label}</div>
              <div className="text-sm text-gray-400 mt-1">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Team online status (Team Queue only) */}
      {selectedType === 'TEAM' && currentTeam && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Statut de l'équipe: <span style={{ color: '#FFCB05' }}>{currentTeam.name}</span></h3>
            <button onClick={refreshTeamOnline} className="text-gray-500 hover:text-gray-300 transition-colors"><RefreshCw size={13} /></button>
          </div>
          <div className="space-y-2">
            {(currentTeam.members || []).map(m => {
              const isOnline = !!teamOnline[m.userId];
              return (
                <div key={m.userId} className="flex items-center gap-2">
                  {isOnline ? <Wifi size={12} className="text-green-400" /> : <WifiOff size={12} className="text-gray-600" />}
                  <span className="text-sm text-gray-300">{m.user?.username}</span>
                  {m.role === 'CAPTAIN' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,203,5,0.15)', color: '#FFCB05' }}>CAP</span>}
                  <span className={`ml-auto text-xs ${isOnline ? 'text-green-400' : 'text-gray-600'}`}>
                    {isOnline ? 'En ligne' : 'Hors ligne'}
                  </span>
                </div>
              );
            })}
          </div>
          {Object.values(teamOnline).some(v => !v) && (
            <p className="text-xs text-red-400 mt-3">⚠️ Des membres sont hors ligne. Tous doivent être connectés pour lancer la queue.</p>
          )}
        </div>
      )}

      {selectedType === 'TEAM' && !currentTeam && (
        <div className="card p-4 mb-6 border-yellow-500/20">
          <p className="text-sm text-yellow-500 text-center">
            ⚠️ Vous n'avez pas d'équipe {selectedMode === 'TWO_V_TWO' ? '2v2' : '5v5'}.{' '}
            <Link to="/team/manage" className="underline">Créer une équipe</Link>
          </p>
        </div>
      )}

      {/* Join button */}
      <div className="card p-6 text-center">
        <div className="mb-4">
          <span className="text-sm text-gray-400">Format sélectionné: </span>
          <span className="font-bold text-yellow-500">{selectedMode === 'TWO_V_TWO' ? '2v2' : '5v5'} · {selectedType === 'SOLO' ? 'Solo Queue' : 'Team Queue'}</span>
        </div>
        {(() => {
          const noTeam = selectedType === 'TEAM' && !currentTeam;
          const hasOffline = selectedType === 'TEAM' && currentTeam && Object.values(teamOnline).some(v => !v);
          const teamSize = selectedMode === 'TWO_V_TWO' ? 2 : 5;
          const notEnoughMembers = selectedType === 'TEAM' && currentTeam && (currentTeam.members?.length || 0) < teamSize;
          const disabled = joining || noTeam || hasOffline || notEnoughMembers;
          const reason = noTeam ? `Vous n'avez pas d'équipe ${selectedMode === 'TWO_V_TWO' ? '2v2' : '5v5'}`
            : notEnoughMembers ? `Il faut ${teamSize} membres (${currentTeam.members?.length}/${teamSize})`
            : hasOffline ? 'Des membres sont hors ligne'
            : null;
          return (
            <>
              <button onClick={handleJoin} disabled={disabled} className="btn-primary text-lg px-12 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto">
                {joining ? <><RefreshCw size={16} className="animate-spin" /> Recherche...</> : <><Swords size={16} /> Rejoindre la file</>}
              </button>
              {reason && <p className="text-xs text-red-400 mt-2">{reason}</p>}
            </>
          );
        })()}
        <p className="text-xs text-gray-500 mt-3">Le matching se base sur votre Elo. La tolérance augmente avec le temps d'attente.</p>
      </div>
    </div>
  );
}
