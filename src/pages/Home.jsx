import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ladderApi, newsApi, tournamentsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import RankBadge from '../components/ui/RankBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function HeroSection({ user, stats }) {
  return (
    <section className="relative overflow-hidden py-20 px-4" style={{ background: 'radial-gradient(ellipse at top, #1a2035 0%, #0D0F14 70%)' }}>
      {/* BG decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 text-yellow-500 text-sm font-medium mb-6">
          <span className="animate-pulse">●</span> Saison 1 en cours
        </div>

        <h1 className="font-display font-bold text-5xl md:text-7xl mb-4 leading-tight">
          La compétition<br />
          <span className="text-gradient-yellow">Pokémon</span> commence ici
        </h1>
        <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Matchmaking 2v2 & 5v5, système Elo compétitif, ladder mondial.<br />
          Prouve que tu es le meilleur dresseur.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          {user ? (
            <Link to="/matchmaking" className="btn-primary text-lg px-8 py-3">
              ⚔️ Jouer maintenant
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary text-lg px-8 py-3">🚀 Commencer gratuitement</Link>
              <Link to="/ladder" className="btn-ghost text-lg px-8 py-3">🏆 Voir le classement</Link>
            </>
          )}
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { label: 'Joueurs', value: stats.totalPlayers?.toLocaleString() },
              { label: 'Matchs joués', value: stats.totalMatches?.toLocaleString() },
              { label: 'Équipes', value: stats.totalTeams?.toLocaleString() },
              { label: 'En ligne', value: stats.onlinePlayers },
            ].map(s => (
              <div key={s.label} className="card p-3 text-center">
                <div className="text-2xl font-bold font-display text-yellow-500">{s.value ?? '—'}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TopPlayerCard({ player, position }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <Link to={`/profile/${player.id}`} className="card-hover p-4 flex items-center gap-3">
      <span className="text-xl w-8 text-center">{medals[position - 1] || `#${position}`}</span>
      <Avatar src={player.avatarUrl} username={player.username} size={40} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{player.username}</div>
        <RankBadge rank={player.rank} />
      </div>
      <div className="text-right">
        <div className="font-bold text-yellow-500">{player.eloGlobal}</div>
        <div className="text-xs text-gray-500">{player.winrate}% WR</div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [news, setNews] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ladderApi.stats(),
      ladderApi.players({ limit: 5 }),
      newsApi.list(),
      tournamentsApi.list(),
    ]).then(([statsRes, playersRes, newsRes, toursRes]) => {
      setStats(statsRes.data);
      setTopPlayers(playersRes.data.players || []);
      setNews(newsRes.data || []);
      setTournaments(toursRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-32"><LoadingSpinner size="lg" text="Chargement..." /></div>;

  return (
    <div>
      <HeroSection user={user} stats={stats} />

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">

        {/* Game modes */}
        <section>
          <h2 className="section-title text-center mb-8">Modes de jeu</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { mode: '2v2', icon: '⚔️', desc: 'Affrontez une équipe de 2 joueurs. Vitesse, stratégie, coordination.', color: 'yellow' },
              { mode: '5v5', icon: '🎮', desc: 'Bataille épique en équipe de 5. Le format phare de la compétition.', color: 'blue' },
            ].map(m => (
              <div key={m.mode} className={`card p-6 border-${m.color}-500/20 hover:border-${m.color}-500/40 transition-all`}>
                <div className="text-4xl mb-3">{m.icon}</div>
                <h3 className="font-display font-bold text-xl mb-2">{m.mode} <span className={`text-${m.color}-500`}>Compétitif</span></h3>
                <p className="text-gray-400 text-sm mb-4">{m.desc}</p>
                {user ? (
                  <Link to="/matchmaking" className={`btn-${m.color === 'yellow' ? 'primary' : 'secondary'} text-sm`}>Jouer en {m.mode}</Link>
                ) : (
                  <Link to="/register" className={`btn-${m.color === 'yellow' ? 'primary' : 'secondary'} text-sm`}>S'inscrire pour jouer</Link>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Top players */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">🏆 Top Joueurs</h2>
              <Link to="/ladder" className="text-sm text-yellow-500 hover:text-yellow-400">Voir tout →</Link>
            </div>
            <div className="space-y-2">
              {topPlayers.map((p, i) => <TopPlayerCard key={p.id} player={p} position={i + 1} />)}
            </div>
          </div>

          {/* News */}
          <div>
            <h2 className="section-title mb-4">📰 Actualités</h2>
            <div className="space-y-3">
              {news.slice(0, 4).map(n => (
                <div key={n.id} className="card p-4">
                  {n.isPinned && <span className="badge bg-yellow-500/10 text-yellow-500 mb-2">📌 Épinglé</span>}
                  <h3 className="font-semibold text-sm mb-1">{n.title}</h3>
                  <p className="text-gray-400 text-xs line-clamp-2">{n.content}</p>
                  <p className="text-gray-600 text-xs mt-2">{format(new Date(n.createdAt), 'dd MMM yyyy', { locale: fr })}</p>
                </div>
              ))}
              {news.length === 0 && <p className="text-gray-500 text-sm">Aucune actualité.</p>}
            </div>
          </div>
        </div>

        {/* Tournaments */}
        {tournaments.length > 0 && (
          <section>
            <h2 className="section-title mb-6">🎯 Tournois</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map(t => (
                <div key={t.id} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge ${t.status === 'UPCOMING' ? 'bg-blue-500/10 text-blue-400' : t.status === 'ONGOING' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      {t.status === 'UPCOMING' ? '⏳ À venir' : t.status === 'ONGOING' ? '🔴 En cours' : '✅ Terminé'}
                    </span>
                    <span className="text-xs text-gray-500">{t.mode === 'TWO_V_TWO' ? '2v2' : '5v5'}</span>
                  </div>
                  <h3 className="font-bold mb-1">{t.name}</h3>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">{t.description}</p>
                  {t.prizePool && <div className="text-yellow-500 font-bold text-sm">🏆 {t.prizePool}</div>}
                  <div className="text-xs text-gray-500 mt-2">
                    {format(new Date(t.startDate), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Features */}
        <section className="text-center">
          <h2 className="section-title mb-10">Pourquoi Pokélo ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '⚡', title: 'Matchmaking intelligent', desc: 'Trouvez des adversaires à votre niveau grâce à notre système Elo avec expansion dynamique.' },
              { icon: '📊', title: 'Suivi de progression', desc: 'Graphique Elo, winrate, séries de victoires. Analysez votre évolution en détail.' },
              { icon: '🛡️', title: 'Anti-smurf & équitable', desc: 'Système de détection, K-factor adaptatif et protection des nouveaux joueurs.' },
            ].map(f => (
              <div key={f.title} className="card p-6 text-center">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
