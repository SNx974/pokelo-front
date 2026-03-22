import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import RankBadge from '../components/ui/RankBadge';
import StatCard from '../components/ui/StatCard';
import EloChart from '../components/ui/EloChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function MatchHistoryItem({ match }) {
  const userPart = match.match?.participants?.[0];
  const isWinner = userPart?.isWinner;
  const eloChange = userPart?.eloChange ?? 0;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${isWinner ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
      <div className={`w-12 text-center text-xs font-bold py-1 rounded ${isWinner ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        {isWinner ? 'WIN' : 'LOSS'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-400">
          {match.match?.mode === 'TWO_V_TWO' ? '2v2' : '5v5'} · {match.match?.queueType === 'SOLO' ? 'Solo Queue' : 'Team Queue'}
        </div>
        <div className="text-xs text-gray-600 mt-0.5">
          {match.match?.completedAt ? format(new Date(match.match.completedAt), 'dd MMM HH:mm', { locale: fr }) : '—'}
        </div>
      </div>
      <div className={`text-sm font-bold ${eloChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {eloChange >= 0 ? '+' : ''}{eloChange}
      </div>
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { user: me } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [eloHistory, setEloHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const isOwn = me?.id === id;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      usersApi.getProfile(id),
      usersApi.getMatches(id, { limit: 10 }),
      usersApi.getEloHistory(id),
    ]).then(([profileRes, matchesRes, histRes]) => {
      setProfile(profileRes.data);
      setMatches(matchesRes.data.matches || []);
      setEloHistory(histRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>;
  if (!profile) return <div className="text-center py-32 text-gray-400">Joueur introuvable</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-fade-in">
      {/* Header */}
      <div className="card p-6 mb-6" style={{ background: 'linear-gradient(135deg, rgba(42,117,187,0.1), rgba(255,203,5,0.05))' }}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            <Avatar src={profile.avatarUrl} username={profile.username} size={80} />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-dark-50 ${
              new Date(profile.lastActiveAt) > new Date(Date.now() - 5 * 60 * 1000) ? 'bg-green-400' : 'bg-gray-600'
            }`} />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="font-display font-bold text-3xl">{profile.username}</h1>
              <RankBadge rank={profile.rank} size="lg" />
              {profile.role === 'ADMIN' && <span className="badge bg-red-500/20 text-red-400">🛡️ Admin</span>}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
              {profile.region && <span>🌍 {profile.region}</span>}
              {profile.preferredRole && <span>🎮 {profile.preferredRole}</span>}
              {profile.favoritePokemon && (
                <span className="flex items-center gap-1">
                  ⭐ {profile.favoritePokemon}
                </span>
              )}
              <span>📅 Depuis {format(new Date(profile.createdAt), 'MMM yyyy', { locale: fr })}</span>
            </div>
            {profile.bio && (
              <p className="mt-2 text-sm text-gray-300 max-w-lg">{profile.bio}</p>
            )}
          </div>
          {isOwn && (
            <Link to={`/profile/${id}/edit`} className="btn-ghost text-sm">✏️ Modifier le profil</Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Elo Global"  value={profile.eloGlobal} icon="⚡" color="yellow" />
        <StatCard label="Elo 2v2"    value={profile.elo2v2}    icon="⚔️" color="blue" />
        <StatCard label="Elo 5v5"    value={profile.elo5v5}    icon="🎮" color="blue" />
        <StatCard label="Winrate"    value={`${profile.winrate}%`} icon="📊" color={profile.winrate >= 50 ? 'green' : 'red'} />
        <StatCard label="Victoires"  value={profile.wins}  icon="✅" color="green" />
        <StatCard label="Défaites"   value={profile.losses} icon="❌" color="red" />
        <StatCard label="Matchs"     value={profile.totalMatches} icon="🎯" color="yellow" />
        <StatCard label="Série max"  value={`🔥${profile.bestStreak}`} icon="" color="yellow" sub={`Actuelle: ${profile.winStreak}`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Elo Chart */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="font-bold mb-4">📈 Évolution Elo</h2>
            <EloChart history={eloHistory} />
          </div>

          {/* Match history */}
          <div className="card p-5 mt-4">
            <h2 className="font-bold mb-4">⚔️ Historique des matchs</h2>
            {matches.length ? (
              <div className="space-y-2">
                {matches.map(m => <MatchHistoryItem key={m.id} match={m} />)}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucun match joué.</p>
            )}
          </div>
        </div>

        {/* Side */}
        <div className="space-y-4">
          {/* Rank breakdown */}
          <div className="card p-5">
            <h2 className="font-bold mb-3">🏆 Rangs par mode</h2>
            <div className="space-y-3">
              {[
                { label: 'Global', rank: profile.rank, elo: profile.eloGlobal },
                { label: '2v2',    rank: profile.rank2v2, elo: profile.elo2v2 },
                { label: '5v5',    rank: profile.rank5v5, elo: profile.elo5v5 },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{r.label}</span>
                  <RankBadge rank={r.rank} showElo elo={r.elo} />
                </div>
              ))}
            </div>
          </div>

          {/* Teams */}
          {profile.teamMemberships?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-bold mb-3">🛡️ Équipes</h2>
              <div className="space-y-2">
                {profile.teamMemberships.map(m => (
                  <Link key={m.teamId} to={`/team/${m.team.id}`} className="flex items-center gap-2 hover:bg-dark-300 p-2 rounded-lg transition-colors">
                    <div className="w-8 h-8 rounded-full bg-dark-300 flex items-center justify-center text-xs font-bold text-yellow-500">{m.team.tag}</div>
                    <span className="text-sm font-medium">{m.team.name}</span>
                    {m.role === 'CAPTAIN' && <span className="badge bg-yellow-500/10 text-yellow-500 ml-auto">Cap.</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
