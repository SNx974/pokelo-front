import { useEffect, useState } from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import { adminApi } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

function StatBlock({ label, value, color = 'yellow' }) {
  const colors = { yellow: 'text-yellow-500', blue: 'text-blue-400', green: 'text-green-400', red: 'text-red-400' };
  return (
    <div className="card p-4 text-center">
      <div className={`text-3xl font-bold font-display ${colors[color]}`}>{value ?? '—'}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { adminApi.dashboard().then(r => setStats(r.data)).catch(console.error); }, []);
  if (!stats) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl">Dashboard</h2>
      <div>
        <h3 className="text-sm text-gray-400 mb-3">Joueurs</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatBlock label="Total joueurs"     value={stats.users.total}    color="yellow" />
          <StatBlock label="Nouveaux (24h)"    value={stats.users.today}    color="green" />
          <StatBlock label="Nouveaux (7j)"     value={stats.users.thisWeek} color="blue" />
        </div>
      </div>
      <div>
        <h3 className="text-sm text-gray-400 mb-3">Matchs</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatBlock label="Total matchs"  value={stats.matches.total}    color="yellow" />
          <StatBlock label="Matchs (24h)"  value={stats.matches.today}    color="green" />
          <StatBlock label="Matchs (7j)"   value={stats.matches.thisWeek} color="blue" />
        </div>
      </div>
      <div>
        <h3 className="text-sm text-gray-400 mb-3">Modération</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatBlock label="Litiges actifs"  value={stats.moderation.activeDisputes} color="red" />
          <StatBlock label="Signalements"    value={stats.moderation.openReports}    color="red" />
          <StatBlock label="Équipes totales" value={stats.teams.total}                color="blue" />
        </div>
      </div>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (search = '') => {
    setLoading(true);
    adminApi.listUsers({ q: search }).then(r => setUsers(r.data.users || [])).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const banUser = async (id, username) => {
    const reason = prompt(`Raison du ban pour ${username}:`);
    if (!reason) return;
    const duration = prompt('Durée (heures, laissez vide pour banni permanent):');
    try {
      await adminApi.banUser(id, { reason, duration: duration ? parseInt(duration) : null });
      toast.success(`${username} banni`);
      load(q);
    } catch {}
  };

  const unbanUser = async (id, username) => {
    try {
      await adminApi.unbanUser(id);
      toast.success(`${username} débanni`);
      load(q);
    } catch {}
  };

  return (
    <div>
      <h2 className="font-display font-bold text-2xl mb-4">Gestion des joueurs</h2>
      <div className="flex gap-3 mb-4">
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(q)} className="input flex-1" placeholder="Rechercher par pseudo ou email..." />
        <button onClick={() => load(q)} className="btn-secondary">Chercher</button>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dark-300 text-gray-400">
              <tr>
                <th className="text-left px-4 py-3">Joueur</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-center px-4 py-3">Elo</th>
                <th className="text-center px-4 py-3">Rôle</th>
                <th className="text-center px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300/50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-dark-300/30">
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-center text-yellow-500 font-bold">{u.eloGlobal}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${u.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-dark-300 text-gray-400'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${u.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {u.isBanned ? 'Banni' : 'Actif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/profile/${u.id}`} className="text-xs text-blue-400 hover:text-blue-300">Voir</Link>
                      {u.isBanned
                        ? <button onClick={() => unbanUser(u.id, u.username)} className="text-xs text-green-400 hover:text-green-300">Débannir</button>
                        : <button onClick={() => banUser(u.id, u.username)} className="text-xs text-red-400 hover:text-red-300">Bannir</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    adminApi.listDisputes({ status: 'OPEN' }).then(r => setDisputes(r.data || [])).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const resolve = async (id) => {
    const resolution = prompt('Résolution:');
    if (!resolution) return;
    try {
      await adminApi.resolveDispute(id, { status: 'RESOLVED', resolution });
      toast.success('Litige résolu');
      load();
    } catch {}
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="font-display font-bold text-2xl mb-4">Litiges ({disputes.length})</h2>
      {disputes.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">✅ Aucun litige ouvert</div>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => (
            <div key={d.id} className="card p-4 border-red-500/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium mb-1">Match: <Link to={`/match/${d.matchId}`} className="text-blue-400 hover:text-blue-300">{d.matchId.slice(0, 8)}...</Link></div>
                  <p className="text-gray-400 text-sm">{d.description}</p>
                  <div className="flex gap-2 mt-2 text-xs text-gray-500">
                    {d.match?.participants?.slice(0, 3).map(p => <span key={p.userId}>{p.user?.username}</span>)}
                  </div>
                </div>
                <button onClick={() => resolve(d.id)} className="btn-primary text-sm py-1.5 whitespace-nowrap">Résoudre</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/users', label: 'Joueurs', icon: '👥' },
  { to: '/admin/disputes', label: 'Litiges', icon: '⚠️' },
];

export default function AdminPanel() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">🛡️</span>
        <div>
          <h1 className="font-display font-bold text-3xl">Panel Admin</h1>
          <p className="text-gray-400 text-sm">Gestion de la plateforme Pokélo</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="w-48 shrink-0 space-y-1">
          {adminNav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-yellow-500/10 text-yellow-500' : 'text-gray-400 hover:bg-dark-300 hover:text-white'}`
              }>
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="disputes" element={<Disputes />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
