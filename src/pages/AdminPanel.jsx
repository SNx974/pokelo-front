import { useEffect, useState, useRef } from 'react';
import { Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom';
import { adminApi, matchesApi, usersApi } from '../services/api';
import Avatar from '../components/ui/Avatar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function Badge({ children, color = 'gray' }) {
  const colors = {
    gray:   'bg-gray-500/20 text-gray-400',
    yellow: 'bg-yellow-500/20 text-yellow-500',
    green:  'bg-green-500/20 text-green-400',
    red:    'bg-red-500/20 text-red-400',
    blue:   'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };
  return <span className={`badge ${colors[color]}`}>{children}</span>;
}

function StatCard({ label, value, color = 'yellow', icon }) {
  const colors = {
    yellow: 'text-yellow-500', blue: 'text-blue-400',
    green: 'text-green-400', red: 'text-red-400', purple: 'text-purple-400',
  };
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-xs uppercase tracking-wide">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className={`text-3xl font-bold font-display ${colors[color]}`}>{value ?? '—'}</div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { adminApi.dashboard().then(r => setStats(r.data)).catch(console.error); }, []);
  if (!stats) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl">Dashboard</h2>

      {(stats.moderation.activeDisputes > 0 || stats.moderation.openReports > 0) && (
        <div className="card p-4 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="font-bold text-red-400">Action requise</div>
              <div className="text-sm text-gray-400 flex gap-4 mt-0.5">
                {stats.moderation.activeDisputes > 0 && (
                  <Link to="/admin/disputes" className="hover:text-white transition-colors">
                    {stats.moderation.activeDisputes} litige{stats.moderation.activeDisputes > 1 ? 's' : ''} ouvert{stats.moderation.activeDisputes > 1 ? 's' : ''} →
                  </Link>
                )}
                {stats.moderation.openReports > 0 && (
                  <Link to="/admin/reports" className="hover:text-white transition-colors">
                    {stats.moderation.openReports} signalement{stats.moderation.openReports > 1 ? 's' : ''} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Joueurs</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Total"        value={stats.users.total}    color="yellow" icon="👥" />
          <StatCard label="Nouveaux 24h" value={stats.users.today}    color="green"  icon="📈" />
          <StatCard label="Nouveaux 7j"  value={stats.users.thisWeek} color="blue"   icon="📅" />
        </div>
      </div>

      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Matchs</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total"     value={stats.matches.total}    color="yellow" icon="⚔️" />
          <StatCard label="En cours"  value={stats.matches.active}   color="blue"   icon="🔵" />
          <StatCard label="Aujourd'hui" value={stats.matches.today}  color="green"  icon="📈" />
          <StatCard label="Cette semaine" value={stats.matches.thisWeek} color="purple" icon="📅" />
        </div>
      </div>

      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Modération</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Litiges actifs"  value={stats.moderation.activeDisputes} color="red"    icon="⚠️" />
          <StatCard label="Signalements"    value={stats.moderation.openReports}    color="red"    icon="🚩" />
          <StatCard label="Équipes totales" value={stats.teams.total}               color="yellow" icon="🛡️" />
        </div>
      </div>
    </div>
  );
}

// ─── Gestion joueurs ──────────────────────────────────────────────────────────

function Users() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [banModal, setBanModal] = useState(null);
  const [roleModal, setRoleModal] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('');

  const load = (search = '') => {
    setLoading(true);
    adminApi.listUsers({ q: search }).then(r => setUsers(r.data.users || [])).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const doban = async () => {
    if (!banReason.trim()) return toast.error('Raison requise');
    try {
      await adminApi.banUser(banModal.id, {
        reason: banReason,
        duration: banDuration ? parseInt(banDuration) : null,
      });
      toast.success(`${banModal.username} banni`);
      setBanModal(null); setBanReason(''); setBanDuration('');
      load(q);
    } catch {}
  };

  const doUnban = async (id, username) => {
    if (!confirm(`Débannir ${username} ?`)) return;
    try {
      await adminApi.unbanUser(id);
      toast.success(`${username} débanni`);
      load(q);
    } catch {}
  };

  const doRole = async (id, role) => {
    try {
      await adminApi.updateUserRole(id, role);
      toast.success('Rôle mis à jour');
      setRoleModal(null);
      load(q);
    } catch {}
  };

  const roleColor = { USER: 'gray', MODERATOR: 'blue', ADMIN: 'red' };

  return (
    <div>
      <h2 className="font-display font-bold text-2xl mb-5">Gestion des joueurs</h2>

      <div className="flex gap-3 mb-5">
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(q)}
          className="input flex-1" placeholder="Rechercher pseudo ou email..." />
        <button onClick={() => load(q)} className="btn-secondary px-5">Chercher</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dark-300/60 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Joueur</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Email</th>
                <th className="text-center px-4 py-3">Elo</th>
                <th className="text-center px-4 py-3 hidden md:table-cell">Stats</th>
                <th className="text-center px-4 py-3">Rôle</th>
                <th className="text-center px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300/30">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-dark-300/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar username={u.username} size={28} />
                      <span className="font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{u.email}</td>
                  <td className="px-4 py-3 text-center text-yellow-500 font-bold">{u.eloGlobal}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400 hidden md:table-cell">
                    <span className="text-green-400">{u.wins}W</span> / <span className="text-red-400">{u.losses}L</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setRoleModal(u)} className="hover:opacity-70 transition-opacity">
                      <Badge color={roleColor[u.role]}>{u.role}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge color={u.isBanned ? 'red' : 'green'}>{u.isBanned ? 'Banni' : 'Actif'}</Badge>
                    {u.banExpiresAt && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        jusqu'au {format(new Date(u.banExpiresAt), 'dd/MM', { locale: fr })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link to={`/profile/${u.id}`} className="text-xs text-blue-400 hover:text-blue-300">Profil</Link>
                      {u.isBanned
                        ? <button onClick={() => doUnban(u.id, u.username)} className="text-xs text-green-400 hover:text-green-300">Débannir</button>
                        : <button onClick={() => setBanModal(u)} className="text-xs text-red-400 hover:text-red-300">Bannir</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucun joueur trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ban */}
      {banModal && (
        <Modal title={`Bannir ${banModal.username}`} onClose={() => { setBanModal(null); setBanReason(''); setBanDuration(''); }}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Raison *</label>
              <input value={banReason} onChange={e => setBanReason(e.target.value)} className="input w-full" placeholder="Ex: comportement toxique, triche..." />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Durée (heures) — laisser vide = ban permanent</label>
              <input type="number" value={banDuration} onChange={e => setBanDuration(e.target.value)} className="input w-full" placeholder="Ex: 24, 72, 168..." min="1" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={doban} className="btn-danger flex-1">Confirmer le ban</button>
              <button onClick={() => setBanModal(null)} className="btn-secondary flex-1">Annuler</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Rôle */}
      {roleModal && (
        <Modal title={`Modifier le rôle de ${roleModal.username}`} onClose={() => setRoleModal(null)}>
          <div className="space-y-2">
            {['USER', 'MODERATOR', 'ADMIN'].map(role => (
              <button key={role} onClick={() => doRole(roleModal.id, role)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${roleModal.role === role ? 'border-yellow-500 bg-yellow-500/10' : 'border-dark-300 hover:border-dark-400'}`}>
                <div className="font-medium">
                  {role === 'USER' && '👤 Joueur'}
                  {role === 'MODERATOR' && '🛡️ Modérateur'}
                  {role === 'ADMIN' && '👑 Administrateur'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {role === 'USER' && 'Accès standard, peut jouer et rejoindre des équipes.'}
                  {role === 'MODERATOR' && 'Accès au panel admin en lecture, peut résoudre des litiges.'}
                  {role === 'ADMIN' && 'Accès complet : bannissements, overrides, gestion du contenu.'}
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Litiges ──────────────────────────────────────────────────────────────────

function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('OPEN');
  const [resolveModal, setResolveModal] = useState(null);
  const [resolution, setResolution] = useState('');
  const [forceWinner, setForceWinner] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.listDisputes({ status: filter }).then(r => setDisputes(r.data || [])).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);

  const doResolve = async (status) => {
    if (!resolution.trim()) return toast.error('Note de résolution requise');
    try {
      await adminApi.resolveDispute(resolveModal.id, {
        status,
        resolution,
        winnerTeam: forceWinner,
      });
      toast.success('Litige traité');
      setResolveModal(null); setResolution(''); setForceWinner(null);
      load();
    } catch {}
  };

  const statusColor = { OPEN: 'red', UNDER_REVIEW: 'yellow', RESOLVED: 'green', DISMISSED: 'gray' };
  const statusLabel = { OPEN: 'Ouvert', UNDER_REVIEW: 'En cours', RESOLVED: 'Résolu', DISMISSED: 'Classé' };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-2xl">Litiges</h2>
        <div className="flex gap-2">
          {['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'ALL'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${filter === s ? 'bg-yellow-500/20 text-yellow-500' : 'bg-dark-300 text-gray-400 hover:text-white'}`}>
              {s === 'ALL' ? 'Tous' : statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : disputes.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <div className="text-4xl mb-3">✅</div>
          <div>Aucun litige {filter !== 'ALL' ? statusLabel[filter].toLowerCase() : ''}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(d => {
            const team1 = d.match?.participants?.filter(p => p.team === 1) || [];
            const team2 = d.match?.participants?.filter(p => p.team === 2) || [];
            const sub1 = d.match?.scoreSubmissions?.find(s => s.teamSide === 1);
            const sub2 = d.match?.scoreSubmissions?.find(s => s.teamSide === 2);

            return (
              <div key={d.id} className="card p-5 border-red-500/20">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <div className="font-bold">
                        Match <Link to={`/match/${d.matchId}`} className="text-blue-400 hover:text-blue-300 font-mono text-sm">
                          {d.matchId.slice(0, 8)}...
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(d.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </div>
                    </div>
                  </div>
                  <Badge color={statusColor[d.status]}>{statusLabel[d.status]}</Badge>
                </div>

                {/* Description */}
                <div className="bg-dark-300/40 rounded-lg p-3 mb-4 text-sm text-gray-300">
                  {d.description}
                </div>

                {/* Équipes */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[{ players: team1, side: 1, sub: sub1 }, { players: team2, side: 2, sub: sub2 }].map(({ players, side, sub }) => (
                    <div key={side} className="bg-dark-300/30 rounded-lg p-3">
                      <div className="text-xs font-bold text-gray-400 mb-2">Équipe {side}</div>
                      <div className="space-y-1.5 mb-2">
                        {players.map(p => (
                          <div key={p.userId} className="flex items-center gap-2 text-xs">
                            <Avatar username={p.user?.username} size={20} />
                            <span>{p.user?.username}</span>
                          </div>
                        ))}
                      </div>
                      {sub ? (
                        <div className="text-xs mt-2 pt-2 border-t border-dark-300/50">
                          <span className="text-gray-500">Déclaré par {sub.user?.username} :</span>
                          <span className={`ml-1 font-bold ${sub.winnerTeam === side ? 'text-green-400' : 'text-red-400'}`}>
                            Équipe {sub.winnerTeam} gagne
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-dark-300/50">Pas de soumission</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Résolution si déjà résolue */}
                {d.resolution && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 mb-4 text-sm text-gray-300">
                    <span className="text-green-400 font-bold text-xs uppercase">Résolution : </span>
                    {d.resolution}
                  </div>
                )}

                {/* Actions */}
                {(d.status === 'OPEN' || d.status === 'UNDER_REVIEW') && (
                  <button onClick={() => { setResolveModal(d); setResolution(''); setForceWinner(null); }}
                    className="btn-primary w-full text-sm">
                    Traiter ce litige
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de résolution */}
      {resolveModal && (
        <Modal title="Résoudre le litige" onClose={() => { setResolveModal(null); setResolution(''); setForceWinner(null); }}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Forcer un vainqueur (optionnel)</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2].map(side => (
                  <button key={side} onClick={() => setForceWinner(forceWinner === side ? null : side)}
                    className={`p-3 rounded-lg border text-sm font-bold transition-all ${forceWinner === side ? 'border-yellow-500 bg-yellow-500/15 text-yellow-500' : 'border-dark-300 text-gray-400 hover:border-dark-400'}`}>
                    🏆 Équipe {side}
                  </button>
                ))}
                <button onClick={() => setForceWinner(null)}
                  className={`p-3 rounded-lg border text-sm transition-all ${forceWinner === null ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-dark-300 text-gray-400 hover:border-dark-400'}`}>
                  Sans override
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Note de résolution *</label>
              <textarea value={resolution} onChange={e => setResolution(e.target.value)}
                className="input w-full resize-none h-20" placeholder="Expliquer la décision prise..." />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={() => doResolve('RESOLVED')} className="btn-primary text-sm">
                ✅ Résoudre
              </button>
              <button onClick={() => doResolve('DISMISSED')} className="btn-secondary text-sm">
                Classer sans suite
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Signalements ─────────────────────────────────────────────────────────────

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.listReports({ isResolved: showResolved }).then(r => setReports(r.data || [])).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [showResolved]);

  const doResolve = async (id) => {
    try {
      await adminApi.resolveReport(id);
      toast.success('Signalement résolu');
      load();
    } catch {}
  };

  const doBanFromReport = async (targetId, targetUsername) => {
    const reason = prompt(`Bannir ${targetUsername} — Raison :`);
    if (!reason) return;
    const duration = prompt('Durée en heures (vide = permanent) :');
    try {
      await adminApi.banUser(targetId, { reason, duration: duration ? parseInt(duration) : null });
      toast.success(`${targetUsername} banni`);
      load();
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-2xl">Signalements</h2>
        <button onClick={() => setShowResolved(!showResolved)}
          className="text-xs px-3 py-1.5 rounded-lg bg-dark-300 text-gray-400 hover:text-white transition-colors">
          {showResolved ? 'Voir non résolus' : 'Voir résolus'}
        </button>
      </div>

      {loading ? <LoadingSpinner /> : reports.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <div className="text-4xl mb-3">✅</div>
          <div>Aucun signalement {showResolved ? 'résolu' : 'en attente'}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className={`card p-4 ${!r.isResolved ? 'border-red-500/20' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar username={r.filer?.username} size={24} />
                    <span className="text-sm font-medium">{r.filer?.username}</span>
                    <span className="text-gray-500 text-xs">signale</span>
                    <Avatar username={r.target?.username} size={24} />
                    <Link to={`/profile/${r.target?.id}`} className="text-sm font-medium text-red-400 hover:text-red-300">
                      {r.target?.username}
                    </Link>
                    {r.target?.isBanned && <Badge color="red">Banni</Badge>}
                  </div>
                  <div className="text-sm text-gray-300 mb-1">{r.reason}</div>
                  {r.details && <div className="text-xs text-gray-500">{r.details}</div>}
                  <div className="text-xs text-gray-600 mt-2">
                    {format(new Date(r.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </div>
                </div>

                {!r.isResolved && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => doResolve(r.id)} className="text-xs btn-secondary py-1.5 px-3">
                      ✓ Résoudre
                    </button>
                    {!r.target?.isBanned && (
                      <button onClick={() => doBanFromReport(r.target?.id, r.target?.username)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors">
                        Bannir
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── News ─────────────────────────────────────────────────────────────────────

function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null); // null | 'new' | article
  const [form, setForm] = useState({ title: '', content: '', coverImage: '', isPinned: false, isPublished: false });

  const load = () => {
    setLoading(true);
    adminApi.listAllNews().then(r => setArticles(r.data || [])).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ title: '', content: '', coverImage: '', isPinned: false, isPublished: false });
    setEditModal('new');
  };

  const openEdit = (a) => {
    setForm({ title: a.title, content: a.content, coverImage: a.coverImage || '', isPinned: a.isPinned, isPublished: a.isPublished });
    setEditModal(a);
  };

  const doSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return toast.error('Titre et contenu requis');
    try {
      if (editModal === 'new') {
        await adminApi.createNews(form);
        toast.success('Article créé');
      } else {
        await adminApi.updateNews(editModal.id, form);
        toast.success('Article mis à jour');
      }
      setEditModal(null);
      load();
    } catch {}
  };

  const doDelete = async (id, title) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    try {
      await adminApi.deleteNews(id);
      toast.success('Article supprimé');
      load();
    } catch {}
  };

  const doToggle = async (a, field) => {
    try {
      await adminApi.updateNews(a.id, { [field]: !a[field] });
      load();
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-2xl">Actualités</h2>
        <button onClick={openNew} className="btn-primary text-sm">+ Nouvel article</button>
      </div>

      {loading ? <LoadingSpinner /> : articles.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">Aucun article</div>
      ) : (
        <div className="space-y-3">
          {articles.map(a => (
            <div key={a.id} className={`card p-4 ${!a.isPublished ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold truncate">{a.title}</span>
                    {a.isPinned    && <Badge color="yellow">📌 Épinglé</Badge>}
                    {a.isPublished ? <Badge color="green">Publié</Badge> : <Badge color="gray">Brouillon</Badge>}
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{a.content}</p>
                  <div className="text-xs text-gray-600 mt-2">
                    Par {a.author?.username} · {format(new Date(a.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => openEdit(a)} className="text-xs text-blue-400 hover:text-blue-300">Modifier</button>
                  <button onClick={() => doToggle(a, 'isPublished')} className="text-xs text-yellow-500 hover:text-yellow-400">
                    {a.isPublished ? 'Dépublier' : 'Publier'}
                  </button>
                  <button onClick={() => doToggle(a, 'isPinned')} className="text-xs text-gray-400 hover:text-white">
                    {a.isPinned ? 'Désépingler' : 'Épingler'}
                  </button>
                  <button onClick={() => doDelete(a.id, a.title)} className="text-xs text-red-400 hover:text-red-300">Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editModal !== null && (
        <Modal title={editModal === 'new' ? 'Nouvel article' : 'Modifier l\'article'} onClose={() => setEditModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Titre *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input w-full" placeholder="Titre de l'article" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Contenu *</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className="input w-full resize-none h-28" placeholder="Contenu de l'article..." />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Image de couverture (URL, optionnel)</label>
              <input value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} className="input w-full" placeholder="https://..." />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="rounded" />
                Publier maintenant
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} className="rounded" />
                Épingler
              </label>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={doSave} className="btn-primary flex-1">Enregistrer</button>
              <button onClick={() => setEditModal(null)} className="btn-secondary flex-1">Annuler</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Gestion équipes ──────────────────────────────────────────────────────────

function Teams() {
  const [teams, setTeams] = useState([]);
  const [q, setQ] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [addModal, setAddModal] = useState(null); // teamId
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const load = (search = q, mode = modeFilter) => {
    setLoading(true);
    adminApi.listTeams({ q: search, mode: mode || undefined })
      .then(r => setTeams(r.data.teams || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (searchQ.length < 2) { setSearchRes([]); return; }
    clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      usersApi.search({ q: searchQ })
        .then(r => setSearchRes(r.data || []))
        .catch(() => setSearchRes([]))
        .finally(() => setSearching(false));
    }, 300);
  }, [searchQ]);

  const doDelete = async (id, name) => {
    if (!confirm(`Supprimer l'équipe "${name}" ? Cette action est irréversible.`)) return;
    try {
      await adminApi.deleteTeam(id);
      toast.success('Équipe supprimée');
      load();
    } catch {}
  };

  const doRemoveMember = async (teamId, userId, username) => {
    if (!confirm(`Retirer ${username} de l'équipe ?`)) return;
    try {
      await adminApi.removeTeamMember(teamId, userId);
      toast.success(`${username} retiré`);
      load();
    } catch {}
  };

  const doAddMember = async (userId, username) => {
    try {
      await adminApi.addTeamMember(addModal, { userId, role: 'MEMBER' });
      toast.success(`${username} ajouté`);
      setAddModal(null); setSearchQ(''); setSearchRes([]);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Erreur');
    }
  };

  const MODE_LABELS = { TWO_V_TWO: '2v2', FIVE_V_FIVE: '5v5' };

  return (
    <div>
      <h2 className="font-display font-bold text-2xl mb-5">Gestion des équipes</h2>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(q)}
          className="input flex-1" placeholder="Rechercher une équipe..." />
        <div className="flex gap-2">
          {[{ v: '', l: 'Tous' }, { v: 'TWO_V_TWO', l: '2v2' }, { v: 'FIVE_V_FIVE', l: '5v5' }].map(({ v, l }) => (
            <button key={v} onClick={() => { setModeFilter(v); load(q, v); }}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${modeFilter === v ? 'bg-yellow-500/20 text-yellow-500' : 'bg-dark-300 text-gray-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={() => load(q)} className="btn-secondary px-5">Chercher</button>
      </div>

      {loading ? <LoadingSpinner /> : teams.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">Aucune équipe trouvée</div>
      ) : (
        <div className="space-y-3">
          {teams.map(team => {
            const isOpen = expanded === team.id;
            const captain = team.members.find(m => m.role === 'CAPTAIN');
            return (
              <div key={team.id} className="card overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-4 p-4">
                  <button onClick={() => setExpanded(isOpen ? null : team.id)} className="flex-1 flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ background: team.mode === 'TWO_V_TWO' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)', color: team.mode === 'TWO_V_TWO' ? '#60a5fa' : '#c084fc' }}>
                      {MODE_LABELS[team.mode]}
                    </div>
                    <div>
                      <div className="font-bold">{team.name} <span className="text-xs text-gray-500 font-normal">[{team.tag}]</span></div>
                      <div className="text-xs text-gray-500">
                        Cap: {captain?.user?.username || '—'} · {team.members.length} membre{team.members.length > 1 ? 's' : ''} · {team.eloTeam} Elo
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color={team.mode === 'TWO_V_TWO' ? 'blue' : 'purple'}>{MODE_LABELS[team.mode]}</Badge>
                    <button onClick={() => { setAddModal(team.id); setSearchQ(''); setSearchRes([]); }}
                      className="text-xs text-green-400 hover:text-green-300 transition-colors">+ Ajouter</button>
                    <button onClick={() => doDelete(team.id, team.name)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors">Supprimer</button>
                  </div>
                </div>

                {/* Membres (expandable) */}
                {isOpen && (
                  <div className="border-t border-dark-300/40 px-4 pb-4 pt-3">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Membres</div>
                    <div className="space-y-2">
                      {team.members.map(m => (
                        <div key={m.id} className="flex items-center gap-3 p-2.5 bg-dark-300/30 rounded-lg">
                          <Avatar username={m.user?.username} size={28} />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{m.user?.username}</span>
                            <span className="ml-2 text-xs text-gray-500">{m.user?.eloGlobal} Elo</span>
                          </div>
                          <Badge color={m.role === 'CAPTAIN' ? 'yellow' : 'gray'}>{m.role === 'CAPTAIN' ? 'Capitaine' : 'Membre'}</Badge>
                          {m.role !== 'CAPTAIN' && (
                            <button onClick={() => doRemoveMember(team.id, m.userId, m.user?.username)}
                              className="text-xs text-red-400 hover:text-red-300 transition-colors ml-1">Retirer</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ajouter un membre */}
      {addModal && (
        <Modal title="Ajouter un membre" onClose={() => { setAddModal(null); setSearchQ(''); setSearchRes([]); }}>
          <div className="space-y-4">
            <div className="relative">
              <input
                ref={searchRef}
                autoFocus
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="input w-full pr-10"
                placeholder="Rechercher un joueur..."
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchRes.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 bg-dark-300/40 rounded-xl">
                  <Avatar username={u.username} size={32} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{u.username}</div>
                    <div className="text-xs text-gray-500">{u.eloGlobal} Elo</div>
                  </div>
                  <button onClick={() => doAddMember(u.id, u.username)} className="btn-primary text-xs py-1.5 px-3">
                    Ajouter
                  </button>
                </div>
              ))}
              {searchQ.length >= 2 && !searching && searchRes.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">Aucun joueur trouvé</div>
              )}
              {searchQ.length < 2 && (
                <div className="text-center text-gray-600 text-sm py-4">Tapez au moins 2 caractères</div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Layout principal ─────────────────────────────────────────────────────────

const adminNav = [
  { to: '/admin',           label: 'Dashboard',     icon: '📊', end: true },
  { to: '/admin/users',     label: 'Joueurs',       icon: '👥' },
  { to: '/admin/teams',     label: 'Équipes',       icon: '🛡️' },
  { to: '/admin/disputes',  label: 'Litiges',       icon: '⚠️' },
  { to: '/admin/reports',   label: 'Signalements',  icon: '🚩' },
  { to: '/admin/news',      label: 'Actualités',    icon: '📰' },
];

export default function AdminPanel() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">🛡️</span>
        <div>
          <h1 className="font-display font-bold text-3xl">Panel Admin</h1>
          <p className="text-gray-500 text-sm">Gestion de la plateforme Pokélo</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="w-48 shrink-0">
          <div className="space-y-1 sticky top-20">
            {adminNav.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'text-gray-400 hover:bg-dark-300 hover:text-white'
                  }`
                }>
                <span>{n.icon}</span> {n.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <Routes>
            <Route index        element={<Dashboard />} />
            <Route path="users"    element={<Users />} />
            <Route path="teams"    element={<Teams />} />
            <Route path="disputes" element={<Disputes />} />
            <Route path="reports"  element={<Reports />} />
            <Route path="news"     element={<News />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
