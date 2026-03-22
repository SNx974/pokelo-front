import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ladderApi } from '../services/api';
import Avatar from '../components/ui/Avatar';
import RankBadge from '../components/ui/RankBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const MODES = [
  { value: 'global', label: 'Global', icon: '🌍' },
  { value: 'TWO_V_TWO', label: '2v2', icon: '⚔️' },
  { value: 'FIVE_V_FIVE', label: '5v5', icon: '🎮' },
];
const TABS = [
  { value: 'players', label: 'Joueurs', icon: '👤' },
  { value: 'teams',   label: 'Équipes', icon: '🛡️' },
];
const REGIONS = ['Toutes', 'EU', 'NA', 'ASIA', 'OCE', 'SA'];

function PlayerRow({ player, position }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const elo = player.eloGlobal;

  return (
    <Link to={`/profile/${player.id}`} className="flex items-center gap-3 md:gap-4 px-4 py-3 hover:bg-dark-300/50 transition-colors rounded-lg group">
      <div className="w-8 text-center font-bold font-display text-gray-400 text-sm">
        {medals[position] || <span className="text-gray-500">#{position}</span>}
      </div>
      <Avatar src={player.avatarUrl} username={player.username} size={36} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm group-hover:text-yellow-400 transition-colors truncate">{player.username}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <RankBadge rank={player.rank} />
          {player.region && <span className="text-xs text-gray-500">{player.region}</span>}
        </div>
      </div>
      <div className="hidden md:flex items-center gap-6 text-sm">
        <div className="text-center">
          <div className="font-bold text-yellow-500">{elo}</div>
          <div className="text-xs text-gray-500">Elo</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-green-400">{player.wins}W</div>
          <div className="text-xs text-gray-500">Victoires</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-red-400">{player.losses}L</div>
          <div className="text-xs text-gray-500">Défaites</div>
        </div>
        <div className="text-center w-16">
          <div className={`font-bold ${player.winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{player.winrate}%</div>
          <div className="text-xs text-gray-500">WR</div>
        </div>
        {player.winStreak > 2 && (
          <div className="text-center">
            <div className="font-bold text-orange-400">🔥{player.winStreak}</div>
            <div className="text-xs text-gray-500">Série</div>
          </div>
        )}
      </div>
    </Link>
  );
}

function TeamRow({ team, position }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return (
    <Link to={`/team/${team.id}`} className="flex items-center gap-3 md:gap-4 px-4 py-3 hover:bg-dark-300/50 transition-colors rounded-lg group">
      <div className="w-8 text-center font-bold text-gray-400 text-sm">
        {medals[position] || `#${position}`}
      </div>
      <div className="w-9 h-9 rounded-full bg-dark-300 flex items-center justify-center text-sm font-bold text-yellow-500">
        {team.tag}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm group-hover:text-yellow-400 transition-colors">{team.name}</div>
        <div className="text-xs text-gray-500">{team.members?.length || 0} membres • {team.region}</div>
      </div>
      <div className="hidden md:flex items-center gap-6 text-sm">
        <div className="text-center">
          <div className="font-bold text-yellow-500">{team.eloTeam}</div>
          <div className="text-xs text-gray-500">Elo équipe</div>
        </div>
        <div className="text-center">
          <div className="text-green-400 font-medium">{team.wins}W / <span className="text-red-400">{team.losses}L</span></div>
          <div className="text-xs text-gray-500">{team.winrate}% WR</div>
        </div>
      </div>
    </Link>
  );
}

export default function Ladder() {
  const [tab, setTab] = useState('players');
  const [mode, setMode] = useState('global');
  const [region, setRegion] = useState('Toutes');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50, mode, ...(region !== 'Toutes' ? { region } : {}) };
      const res = tab === 'players' ? await ladderApi.players(params) : await ladderApi.teams(params);
      setData(tab === 'players' ? res.data.players : res.data.teams);
      setTotalPages(tab === 'players' ? res.data.totalPages : res.data.totalPages);
    } catch {}
    setLoading(false);
  }, [tab, mode, region, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [tab, mode, region]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-4xl mb-2">
          <span className="text-gradient-yellow">Ladder</span> Compétitif
        </h1>
        <p className="text-gray-400">Classement en temps réel des meilleurs joueurs et équipes.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-medium transition-all ${tab === t.value ? 'bg-yellow-500 text-dark' : 'bg-dark-300 text-gray-300 hover:bg-dark-400'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-4 mb-6">
        {tab === 'players' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Mode:</span>
            <div className="flex gap-1">
              {MODES.map(m => (
                <button key={m.value} onClick={() => setMode(m.value)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${mode === m.value ? 'bg-blue-500 text-white' : 'bg-dark-300 text-gray-400 hover:bg-dark-400'}`}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Région:</span>
          <div className="flex gap-1 flex-wrap">
            {REGIONS.map(r => (
              <button key={r} onClick={() => setRegion(r)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${region === r ? 'bg-blue-500 text-white' : 'bg-dark-300 text-gray-400 hover:bg-dark-400'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-dark-300 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">
            {tab === 'players' ? '👤 Classement Joueurs' : '🛡️ Classement Équipes'}
            {mode !== 'global' && tab === 'players' && <span className="ml-2 badge bg-blue-500/10 text-blue-400">{mode === 'TWO_V_TWO' ? '2v2' : '5v5'}</span>}
          </span>
          <button onClick={load} className="text-xs text-gray-500 hover:text-yellow-500 transition-colors">🔄 Actualiser</button>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><LoadingSpinner text="Chargement du classement..." /></div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-gray-500">Aucun résultat</div>
        ) : (
          <div className="divide-y divide-dark-300/50">
            {data.map((item, idx) => (
              tab === 'players'
                ? <PlayerRow key={item.id} player={item} position={(page - 1) * 50 + idx + 1} />
                : <TeamRow   key={item.id} team={item}   position={(page - 1) * 50 + idx + 1} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-dark-300 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-sm py-1.5 px-3 disabled:opacity-40">← Précédent</button>
            <span className="text-sm text-gray-400">Page {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost text-sm py-1.5 px-3 disabled:opacity-40">Suivant →</button>
          </div>
        )}
      </div>
    </div>
  );
}
