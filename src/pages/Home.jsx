import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ladderApi, newsApi, tournamentsApi, matchesApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useMatchmakingStore } from '../store/matchmakingStore';
import Avatar from '../components/ui/Avatar';
import RankBadge from '../components/ui/RankBadge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/* ── Small helpers ──────────────────────────────────────── */
function GoldHeader({ icon, label }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 font-bold uppercase tracking-widest text-xs"
      style={{ background: 'linear-gradient(90deg, rgba(255,203,5,0.18), transparent)', borderBottom: '1px solid rgba(255,203,5,0.2)', color: '#FFCB05' }}>
      <span>{icon}</span> {label}
    </div>
  );
}

function GameCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl overflow-hidden relative ${className}`}
      style={{ background: 'linear-gradient(180deg, #0d1f3c 0%, #071428 100%)', border: '1px solid rgba(255,203,5,0.22)' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #FFCB05 40%, #F59E0B 60%, transparent)' }} />
      {children}
    </div>
  );
}

/* ── Hero / Queue section ───────────────────────────────── */
function HeroSection({ user }) {
  const navigate = useNavigate();
  const { joinQueue } = useMatchmakingStore();
  const [selectedMode, setSelectedMode] = useState('SOLO');
  const [selectedFormat, setSelectedFormat] = useState('TWO_V_TWO');
  const [joining, setJoining] = useState(false);

  const handleSearch = async () => {
    if (!user) { navigate('/login'); return; }
    setJoining(true);
    const res = await joinQueue(selectedFormat, selectedMode);
    setJoining(false);
    if (res?.success) navigate('/matchmaking');
  };

  return (
    <section className="relative overflow-hidden" style={{
      background: 'linear-gradient(180deg, #0a1e40 0%, #05122e 40%, #050d1a 100%)',
      minHeight: 420,
    }}>
      {/* Stadium atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top glow */}
        <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '300px', background: 'radial-gradient(ellipse, rgba(42,117,187,0.25) 0%, transparent 70%)' }} />
        {/* Side lights */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '300px', height: '200px', background: 'radial-gradient(ellipse at top left, rgba(255,203,5,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '200px', background: 'radial-gradient(ellipse at top right, rgba(255,100,50,0.10) 0%, transparent 70%)' }} />
        {/* Grid lines decoration */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,203,5,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,203,5,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-10">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-widest"
            style={{ background: 'rgba(255,203,5,0.12)', border: '1px solid rgba(255,203,5,0.3)', color: '#FFCB05' }}>
            <span className="animate-pulse">●</span> Battle Ranked — Saison 1
          </div>
          <h1 className="font-bebas text-5xl md:text-6xl tracking-wide mb-2">
            Combattez en{' '}
            <span style={{ color: '#FFCB05', textShadow: '0 0 30px rgba(255,203,5,0.5)' }}>2v2</span>
            {' '}&{' '}
            <span style={{ color: '#FFCB05', textShadow: '0 0 30px rgba(255,203,5,0.5)' }}>5v5</span>
          </h1>
          <p className="text-gray-400 text-base font-semibold italic">
            Rejoignez le Battle Ranked et grimpez dans le classement !
          </p>
        </div>

        {/* Queue cards + Lucario */}
        <div className="relative flex items-center gap-4 mb-6">
          {/* Solo Queue */}
          <div
            role="button" tabIndex={0}
            onClick={() => { setSelectedMode('SOLO'); setSelectedFormat('TWO_V_TWO'); }}
            onKeyDown={e => e.key === 'Enter' && setSelectedMode('SOLO')}
            className={`queue-card queue-card-solo text-left p-5 flex-1 ${selectedMode === 'SOLO' ? 'selected-solo' : ''}`}>
            <div>
              <div className="font-bebas text-3xl tracking-wider text-white mb-1" style={{ textShadow: '0 0 20px rgba(42,117,187,0.8)' }}>Solo Queue</div>
              <div className="text-blue-400 font-bold text-sm">1 vs 1 — 2v2 & 5v5</div>
              <p className="text-gray-400 text-xs mt-2">Affrontez des joueurs seul.<br />Matchmaking basé sur votre Elo.</p>
            </div>
            {selectedMode === 'SOLO' && (
              <div className="mt-3 flex gap-2">
                {['TWO_V_TWO', 'FIVE_V_FIVE'].map(f => (
                  <span key={f} role="button" tabIndex={0} onClick={e => { e.stopPropagation(); setSelectedFormat(f); }}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer select-none ${selectedFormat === f ? 'bg-yellow-500 text-navy' : 'bg-white/10 text-gray-300'}`}>
                    {f === 'TWO_V_TWO' ? '2v2' : '5v5'}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Lucario centré */}
          <div className="flex-shrink-0 flex items-end justify-center" style={{ width: 160, height: 180 }}>
            <img src="/lucario.png" alt="Lucario" style={{ height: 180, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 24px rgba(42,117,187,0.7))' }} />
          </div>

          {/* Team Queue */}
          <div
            role="button" tabIndex={0}
            onClick={() => { setSelectedMode('TEAM'); setSelectedFormat('FIVE_V_FIVE'); }}
            onKeyDown={e => e.key === 'Enter' && setSelectedMode('TEAM')}
            className={`queue-card queue-card-team text-left p-5 flex-1 ${selectedMode === 'TEAM' ? 'selected-team' : ''}`}>
            <div>
              <div className="font-bebas text-3xl tracking-wider text-white mb-1" style={{ textShadow: '0 0 20px rgba(192,57,43,0.8)' }}>Team Queue</div>
              <div className="text-red-400 font-bold text-sm">2vs / 5vs — En équipe</div>
              <p className="text-gray-400 text-xs mt-2">Jouez avec votre équipe.<br />Coordination & stratégie.</p>
            </div>
            {selectedMode === 'TEAM' && (
              <div className="mt-3 flex gap-2">
                {['TWO_V_TWO', 'FIVE_V_FIVE'].map(f => (
                  <span key={f} role="button" tabIndex={0} onClick={e => { e.stopPropagation(); setSelectedFormat(f); }}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer select-none ${selectedFormat === f ? 'bg-yellow-500 text-navy' : 'bg-white/10 text-gray-300'}`}>
                    {f === 'TWO_V_TWO' ? '2v2' : '5v5'}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSearch}
            disabled={joining}
            className="btn-primary px-16 py-4 rounded-xl text-lg font-bebas tracking-widest uppercase"
            style={{ fontSize: '1.1rem', letterSpacing: '0.15em', minWidth: 320 }}
          >
            {joining ? '⏳ Recherche...' : '⚔️ Lancer la Recherche'}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Mon Profil card ──────────────────────────────────────*/
function ProfileCard({ user }) {
  if (!user) return (
    <GameCard>
      <GoldHeader icon="💠" label="Mon Profil" />
      <div className="p-5 text-center">
        <p className="text-gray-400 text-sm mb-4">Connectez-vous pour voir votre profil</p>
        <Link to="/login" className="btn-primary px-6 py-2 text-sm rounded-lg">Se connecter</Link>
      </div>
    </GameCard>
  );
  const winrate = user.totalMatches > 0 ? Math.round(user.wins / user.totalMatches * 100) : 0;
  return (
    <GameCard>
      <GoldHeader icon="💠" label="Mon Profil" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <Avatar src={user.avatarUrl} username={user.username} size={48} />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-navy" />
          </div>
          <div>
            <div className="font-bold text-base">{user.username}</div>
            <div className="flex items-center gap-1 text-sm" style={{ color: '#FFCB05' }}>
              <span>⚡</span>
              <span className="font-bold">Elo: {user.eloGlobal}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3 text-center text-sm">
          <div className="rounded-lg py-1.5" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="font-bold text-green-400">{user.wins}</div>
            <div className="text-xs text-gray-500">Victoires</div>
          </div>
          <div className="rounded-lg py-1.5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="font-bold text-red-400">{user.losses}</div>
            <div className="text-xs text-gray-500">Défaites</div>
          </div>
        </div>
        <Link to={`/profile/${user.id}`}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg font-bold text-sm transition-all hover:-translate-y-px"
          style={{ background: 'linear-gradient(135deg, #FFCB05, #F59E0B)', color: '#050d1a' }}>
          Voir Profil →
        </Link>
      </div>
    </GameCard>
  );
}

/* ── Top Ladder card ──────────────────────────────────────*/
function LadderCard({ players }) {
  const medals = ['🥇', '🥈', '🥉'];
  const rankColors = ['#FFCB05', '#94a3b8', '#cd7f32'];
  return (
    <GameCard>
      <GoldHeader icon="🏆" label="Top Ladder" />
      <div className="p-4 space-y-2">
        {players.slice(0, 3).map((p, i) => (
          <Link key={p.id} to={`/profile/${p.id}`}
            className="flex items-center gap-3 p-2 rounded-lg transition-all hover:bg-white/5">
            <span className="text-lg w-6 text-center">{medals[i]}</span>
            <Avatar src={p.avatarUrl} username={p.username} size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{p.username}</div>
            </div>
            <div className="font-bold text-sm" style={{ color: rankColors[i] }}>{p.eloGlobal}</div>
            <RankBadge rank={p.rank} />
          </Link>
        ))}
        {players.length === 0 && <p className="text-gray-500 text-xs text-center py-3">Aucun joueur</p>}
        <div className="pt-1">
          <Link to="/ladder"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg font-bold text-sm transition-all hover:-translate-y-px text-white"
            style={{ background: 'linear-gradient(135deg, #1a4a8a, #2A75BB)', boxShadow: '0 4px 12px rgba(42,117,187,0.35)' }}>
            Voir le Classement
          </Link>
        </div>
      </div>
    </GameCard>
  );
}

/* ── Actualités card ──────────────────────────────────────*/
function NewsCard({ news }) {
  return (
    <GameCard>
      <GoldHeader icon="📢" label="Actualités" />
      <div className="p-4 space-y-3">
        {news.slice(0, 2).map(n => (
          <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
            {/* Thumbnail */}
            <div className="w-16 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #1a3a5c, #0d1f3c)', border: '1px solid rgba(255,203,5,0.2)' }}>
              {n.isPinned ? '📌' : '📰'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold leading-tight line-clamp-1">{n.title}</div>
              <div className="text-xs text-gray-400 mt-0.5 line-clamp-2 italic">{n.content}</div>
            </div>
          </div>
        ))}
        {news.length === 0 && <p className="text-gray-500 text-xs text-center py-3">Aucune actualité</p>}
      </div>
    </GameCard>
  );
}

/* ── Trouvez une équipe ───────────────────────────────────*/
function FindTeamCard() {
  return (
    <GameCard className="relative overflow-hidden">
      <GoldHeader icon="🛡️" label="Trouvez une Équipe" />
      <div className="p-5 flex items-center gap-4">
        <div className="text-5xl flex-shrink-0">👥</div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-300 text-sm mb-3">Rejoignez ou créez votre équipe pour jouer en Team Queue !</p>
          <Link to="/teams"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #FFCB05, #F59E0B)', color: '#050d1a', boxShadow: '0 4px 12px rgba(255,203,5,0.3)' }}>
            Rechercher une Équipe
          </Link>
        </div>
      </div>
    </GameCard>
  );
}

/* ── Derniers matchs ──────────────────────────────────────*/
function LastMatchesCard({ matches }) {
  return (
    <GameCard>
      <GoldHeader icon="⚔️" label="Derniers Matchs" />
      <div className="p-4 space-y-2">
        {matches.length === 0 && <p className="text-gray-500 text-xs text-center py-3">Aucun match récent</p>}
        {matches.slice(0, 4).map(m => {
          const myPart = m.participants?.[0];
          const won = myPart?.isWinner;
          const change = myPart?.eloChange ?? 0;
          const mode = m.mode === 'TWO_V_TWO' ? '2v2' : '5v5';
          return (
            <Link key={m.id} to={`/match/${m.id}`}
              className="flex items-center gap-3 p-2.5 rounded-lg transition-all hover:bg-white/5"
              style={{ border: `1px solid ${won === true ? 'rgba(34,197,94,0.2)' : won === false ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
              {/* Pokémon icons */}
              <div className="flex gap-0.5 text-xl">
                <span>{m.mode === 'TWO_V_TWO' ? '⚔️' : '🎮'}</span>
              </div>
              {/* Result badge */}
              <div className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${
                won === true ? 'bg-green-500/20 text-green-400' :
                won === false ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {won === true ? 'Victoire' : won === false ? 'Défaite' : 'En cours'}
              </div>
              <span className="text-xs text-gray-400 font-semibold">{mode}</span>
              <div className="ml-auto text-sm font-bold">
                {m.status === 'COMPLETED' && (
                  <span className={change >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {change >= 0 ? '+' : ''}{change} Elo
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </GameCard>
  );
}

/* ── Tournois Banner ──────────────────────────────────────*/
function TournoisBanner({ tournaments }) {
  const next = tournaments.find(t => t.status === 'UPCOMING') || tournaments[0];
  return (
    <div className="relative rounded-xl overflow-hidden" style={{
      background: 'linear-gradient(135deg, #1a0a2e 0%, #2d0a5e 30%, #1a0a2e 100%)',
      border: '1px solid rgba(255,203,5,0.25)',
      minHeight: 120,
    }}>
      {/* Gold top border */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #FFCB05 50%, transparent)' }} />
      {/* BG decoration */}
      <div className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none opacity-10">
        <span className="text-9xl">🌌</span>
      </div>
      <div className="relative p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🏆</span>
            <span className="font-bebas text-3xl tracking-widest text-white">Tournois à Venir</span>
          </div>
          {next ? (
            <p className="text-gray-300 text-sm">
              <span className="text-yellow-500 font-bold">{next.name}</span>
              {next.prizePool && <span className="text-gray-400"> — Prize: <span className="text-green-400 font-bold">{next.prizePool}</span></span>}
              <span className="text-gray-500 ml-2">
                {format(new Date(next.startDate), 'dd MMM yyyy', { locale: fr })}
              </span>
            </p>
          ) : (
            <p className="text-gray-400 text-sm">Aucun tournoi prévu pour le moment</p>
          )}
        </div>
        <Link to="/tournaments"
          className="flex-shrink-0 px-8 py-3 rounded-xl font-bebas tracking-widest text-lg uppercase transition-all hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #1a4a8a, #2A75BB)', color: '#fff', boxShadow: '0 4px 20px rgba(42,117,187,0.5)', letterSpacing: '0.1em' }}>
          S'inscrire Maintenant
        </Link>
      </div>
    </div>
  );
}

/* ── Stats Bar ────────────────────────────────────────────*/
function StatsBar({ stats }) {
  if (!stats) return null;
  const items = [
    { label: 'Joueurs inscrits', value: stats.totalPlayers?.toLocaleString() ?? '—', icon: '👥' },
    { label: 'Matchs joués',    value: stats.totalMatches?.toLocaleString()  ?? '—', icon: '⚔️' },
    { label: 'Équipes',         value: stats.totalTeams?.toLocaleString()    ?? '—', icon: '🛡️' },
    { label: 'En ligne',        value: stats.onlinePlayers ?? '—',                   icon: '🟢' },
  ];
  return (
    <div className="py-3 px-4" style={{ background: 'rgba(255,203,5,0.05)', borderBottom: '1px solid rgba(255,203,5,0.12)' }}>
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-8 flex-wrap">
        {items.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span>{s.icon}</span>
            <span className="font-bold text-yellow-500">{s.value}</span>
            <span className="text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────*/
export default function Home() {
  const { user } = useAuthStore();
  const [stats, setStats]         = useState(null);
  const [topPlayers, setTop]       = useState([]);
  const [news, setNews]            = useState([]);
  const [tournaments, setTourneys] = useState([]);
  const [recentMatches, setMatches]= useState([]);

  useEffect(() => {
    Promise.all([
      ladderApi.stats(),
      ladderApi.players({ limit: 5 }),
      newsApi.list(),
      tournamentsApi.list(),
      matchesApi.list({ status: 'COMPLETED', limit: 5 }),
    ]).then(([s, p, n, t, m]) => {
      setStats(s.data);
      setTop(p.data.players || []);
      setNews(n.data || []);
      setTourneys(t.data || []);
      setMatches(m.data.matches || []);
    }).catch(console.error);
  }, []);

  return (
    <div style={{ background: '#050d1a', minHeight: '100vh' }}>
      {/* Stats ticker */}
      <StatsBar stats={stats} />

      {/* Hero */}
      <HeroSection user={user} />

      {/* Dashboard grid */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">

        {/* Row 1 — 3 columns */}
        <div className="grid md:grid-cols-3 gap-4">
          <ProfileCard user={user} />
          <LadderCard  players={topPlayers} />
          <NewsCard    news={news} />
        </div>

        {/* Row 2 — 2 columns */}
        <div className="grid md:grid-cols-2 gap-4">
          <FindTeamCard />
          <LastMatchesCard matches={recentMatches} />
        </div>

        {/* Row 3 — Tournois full width */}
        <TournoisBanner tournaments={tournaments} />

        {/* Footer social */}
        <div className="flex items-center justify-between pt-4 pb-2" style={{ borderTop: '1px solid rgba(255,203,5,0.1)' }}>
          <div className="flex items-center gap-4">
            {[
              { icon: '💬', label: 'Discord', color: '#5865F2' },
              { icon: '🐦', label: 'Twitter', color: '#1DA1F2' },
              { icon: '🎥', label: 'YouTube', color: '#FF0000' },
            ].map(s => (
              <button key={s.label} className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all hover:-translate-y-1 hover:scale-110"
                style={{ background: `${s.color}20`, border: `1px solid ${s.color}40` }} title={s.label}>
                {s.icon}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <a href="#" className="hover:text-gray-400 transition-colors">Mentions Légales</a>
            <span>|</span>
            <a href="#" className="hover:text-gray-400 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
