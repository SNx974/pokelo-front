import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { teamsApi, usersApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { onWS } from '../services/websocket';
import Avatar from '../components/ui/Avatar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const REGIONS = ['EU', 'NA', 'ASIA', 'OCE', 'SA'];
const TEAM_SIZES = { TWO_V_TWO: 2, FIVE_V_FIVE: 5 };
const MODE_LABELS = { TWO_V_TWO: '2v2', FIVE_V_FIVE: '5v5' };

// ─── Sous-composants ──────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Slot vide avec bouton "Inviter"
function EmptySlot({ onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-dark-300 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all group w-full text-left">
      <div className="w-10 h-10 rounded-full bg-dark-300 flex items-center justify-center text-gray-500 group-hover:text-yellow-500 transition-colors">
        <span className="text-xl">+</span>
      </div>
      <div>
        <div className="text-sm text-gray-500 group-hover:text-yellow-500 transition-colors font-medium">Slot disponible</div>
        <div className="text-xs text-gray-600">Cliquer pour inviter un joueur</div>
      </div>
    </button>
  );
}

// Slot rempli
function MemberSlot({ member, isCaptainView, currentUserId, onKick, isOnline }) {
  const isCap = member.role === 'CAPTAIN';
  const isMe  = member.userId === currentUserId;
  const wr    = member.user?.wins + member.user?.losses > 0
    ? Math.round(member.user.wins / (member.user.wins + member.user.losses) * 100)
    : 0;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCap ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-dark-300/50 bg-dark-300/20'}`}>
      <div className="relative shrink-0">
        <Avatar src={member.user?.avatarUrl} username={member.user?.username} size={40} />
        {isCap ? (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs">
            👑
          </div>
        ) : (
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-200 ${isOnline ? 'bg-green-400' : 'bg-gray-600'}`}
            title={isOnline ? 'En ligne' : 'Hors ligne'} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link to={`/profile/${member.userId}`} className="font-semibold text-sm hover:text-yellow-400 transition-colors truncate block">
          {member.user?.username}
          {isMe && <span className="text-xs text-gray-500 ml-1">(vous)</span>}
        </Link>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
          <span className="text-yellow-500 font-bold">{member.user?.eloGlobal} Elo</span>
          <span>·</span>
          <span className="text-green-400">{member.user?.wins}V</span>
          <span className="text-red-400">{member.user?.losses}D</span>
          <span>·</span>
          <span className={wr >= 50 ? 'text-green-400' : 'text-red-400'}>{wr}%</span>
        </div>
      </div>

      {isCaptainView && !isCap && !isMe && (
        <button onClick={() => onKick(member.userId, member.user?.username)}
          className="shrink-0 text-xs text-red-400 hover:text-white hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg transition-all">
          Kick
        </button>
      )}
    </div>
  );
}

// ─── Section Invitations reçues ───────────────────────────────────────────────

function ReceivedInvitations({ onAccepted }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await teamsApi.myInvitations();
      setInvitations(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const off = onWS('TEAM_INVITATION', () => load());
    return () => off();
  }, []);

  const accept = async (invId) => {
    try {
      await teamsApi.acceptInvitation(invId);
      toast.success('Invitation acceptée ! Bienvenue dans l\'équipe 🎉');
      load();
      onAccepted?.();
    } catch {}
  };

  const decline = async (invId) => {
    try {
      await teamsApi.declineInvitation(invId);
      toast.success('Invitation refusée');
      load();
    } catch {}
  };

  if (loading) return null;
  if (invitations.length === 0) return null;

  return (
    <div className="card p-5 mb-6 border-yellow-500/30">
      <h2 className="font-bold mb-4 flex items-center gap-2">
        📬 Invitations reçues
        <span className="bg-yellow-500 text-dark text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ color: '#050d1a' }}>
          {invitations.length}
        </span>
      </h2>
      <div className="space-y-3">
        {invitations.map(inv => (
          <div key={inv.id} className="flex items-center gap-4 p-4 bg-dark-300/30 rounded-xl border border-dark-300/50">
            <div className="w-12 h-12 rounded-xl bg-dark-300 flex items-center justify-center text-yellow-500 font-bold border border-yellow-500/30 text-sm shrink-0">
              [{inv.team.tag}]
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">{inv.team.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Invité par <span className="text-white">{inv.sender.username}</span>
                <span className="mx-1">·</span>
                <span className="text-yellow-500">{inv.team.eloTeam} Elo</span>
                <span className="mx-1">·</span>
                {inv.team.region}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => accept(inv.id)}
                className="text-sm px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg font-medium transition-all">
                ✓ Accepter
              </button>
              <button onClick={() => decline(inv.id)}
                className="text-sm px-3 py-2 bg-dark-300 text-gray-400 hover:text-white rounded-lg transition-all">
                ✗
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Formulaire de création ───────────────────────────────────────────────────

function CreateTeamForm({ onCreated, defaultMode = null }) {
  const [form, setForm] = useState({ name: '', tag: '', description: '', region: 'EU', mode: defaultMode || 'FIVE_V_FIVE' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.tag.trim()) return;
    setLoading(true);
    try {
      const { data } = await teamsApi.create(form);
      toast.success('Équipe créée ! 🎉');
      onCreated(data);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🛡️</div>
        <h2 className="font-bold text-xl mb-1">Créer une équipe {MODE_LABELS[form.mode]}</h2>
        <p className="text-gray-400 text-sm">Fondez votre équipe et recrutez des joueurs.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1.5 block">Nom de l'équipe *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className="input w-full" placeholder="Ex: Team Rocket Elite" maxLength={30} required />
              <div className="text-xs text-gray-600 mt-1">{form.name.length}/30</div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Tag * (2-5 chars)</label>
              <input value={form.tag} onChange={e => set('tag', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="input w-full font-mono tracking-widest text-yellow-500 text-center" placeholder="PKL" maxLength={5} required />
            </div>
          </div>

          {/* Preview du tag */}
          {form.tag && (
            <div className="flex items-center gap-3 p-3 bg-dark-300/40 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-dark-300 border border-yellow-500/30 flex items-center justify-center font-bold text-yellow-500 text-xs">
                [{form.tag}]
              </div>
              <div>
                <div className="font-bold text-sm">{form.name || 'Nom de l\'équipe'}</div>
                <div className="text-xs text-gray-500">Aperçu de votre équipe</div>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Description (optionnel)</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className="input w-full resize-none h-20" placeholder="Décrivez votre équipe, style de jeu, objectifs..." maxLength={200} />
            <div className="text-xs text-gray-600 mt-1">{form.description.length}/200</div>
          </div>

          {!defaultMode && (
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Mode de jeu</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(MODE_LABELS).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => set('mode', key)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all border ${form.mode === key ? 'border-yellow-500 bg-yellow-500/15 text-yellow-500' : 'border-dark-300 text-gray-400 hover:border-dark-400'}`}>
                    <div className="text-2xl mb-1">{key === 'TWO_V_TWO' ? '2⚔️2' : '5⚔️5'}</div>
                    {label} — {TEAM_SIZES[key]} joueurs
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Région</label>
            <div className="flex gap-2 flex-wrap">
              {REGIONS.map(r => (
                <button key={r} type="button" onClick={() => set('region', r)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${form.region === r ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500' : 'border-dark-300 text-gray-400 hover:border-dark-400'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading || !form.name.trim() || !form.tag.trim()}
            className="btn-primary w-full py-3 text-base font-bold disabled:opacity-50">
            {loading ? 'Création...' : '⚔️ Créer l\'équipe'}
          </button>
        </form>
    </div>
  );
}

// ─── Vue capitaine / membre ───────────────────────────────────────────────────

function TeamView({ team, role, onRefresh }) {
  const { user } = useAuthStore();
  const navigate  = useNavigate();
  const isCap     = role === 'CAPTAIN';
  const members   = team.members || [];
  const teamSize  = TEAM_SIZES[team.mode] || 5;
  const emptySlots = Math.max(0, teamSize - members.length);
  const [onlineMap, setOnlineMap] = useState({});

  // Récupère le statut online des membres
  useEffect(() => {
    teamsApi.onlineStatus(team.id)
      .then(({ data }) => setOnlineMap(data))
      .catch(() => {});
    // Rafraîchit toutes les 15s
    const interval = setInterval(() => {
      teamsApi.onlineStatus(team.id)
        .then(({ data }) => setOnlineMap(data))
        .catch(() => {});
    }, 15_000);
    return () => clearInterval(interval);
  }, [team.id]);

  const [inviteModal, setInviteModal]   = useState(false);
  const [editModal, setEditModal]       = useState(false);
  const [searchQ, setSearchQ]           = useState('');
  const [searchRes, setSearchRes]       = useState([]);
  const [searching, setSearching]       = useState(false);
  const [inviting, setInviting]         = useState(null);
  const searchRef = useRef(null);

  const [editForm, setEditForm] = useState({
    name: team.name, description: team.description || '', region: team.region,
  });

  // Recherche de joueurs
  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) { setSearchRes([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await usersApi.search({ q: searchQ, limit: 6 });
        // Filtrer les membres déjà dans l'équipe
        const memberIds = members.map(m => m.userId);
        setSearchRes((data.users || []).filter(u => !memberIds.includes(u.id) && u.id !== user?.id));
      } catch {} finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const handleInvite = async (targetUserId, targetUsername) => {
    setInviting(targetUserId);
    try {
      await teamsApi.invite(team.id, { targetUserId });
      toast.success(`Invitation envoyée à ${targetUsername} !`);
      setSearchQ(''); setSearchRes([]);
      setInviteModal(false);
      onRefresh();
    } catch {} finally { setInviting(null); }
  };

  const handleKick = async (targetId, targetUsername) => {
    if (!confirm(`Retirer ${targetUsername} de l'équipe ?`)) return;
    try {
      await teamsApi.kick(team.id, targetId);
      toast.success(`${targetUsername} a été retiré`);
      onRefresh();
    } catch {}
  };

  const handleCancelInvite = async (invId, username) => {
    try {
      await teamsApi.cancelInvitation(invId);
      toast.success(`Invitation annulée pour ${username}`);
      onRefresh();
    } catch {}
  };

  const handleLeave = async () => {
    if (!confirm('Quitter l\'équipe ?')) return;
    try {
      await teamsApi.leave(team.id);
      toast.success('Vous avez quitté l\'équipe');
      onRefresh();
    } catch {}
  };

  const handleDissolve = async () => {
    if (!confirm(`Dissoudre "${team.name}" définitivement ?`)) return;
    try {
      await teamsApi.delete(team.id);
      toast.success('Équipe dissoute');
      onRefresh();
    } catch {}
  };

  const handleEditSave = async () => {
    try {
      await teamsApi.update(team.id, editForm);
      toast.success('Équipe mise à jour');
      setEditModal(false);
      onRefresh();
    } catch {}
  };

  const winrate = team.wins + team.losses > 0 ? Math.round(team.wins / (team.wins + team.losses) * 100) : 0;

  // Invitations en attente envoyées
  const pendingInvitations = team.invitations || [];

  return (
    <div className="space-y-6">
      {/* Header équipe */}
      <div className="card p-6" style={{ background: 'linear-gradient(135deg, rgba(42,117,187,0.1), rgba(255,203,5,0.05))' }}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-dark-300 flex items-center justify-center font-bold text-yellow-500 border border-yellow-500/30 text-sm shrink-0">
            [{team.tag}]
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl">{team.name}</h1>
              {isCap && <span className="badge bg-yellow-500/20 text-yellow-500">👑 Capitaine</span>}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-400 mt-1">
              <span>🌍 {team.region}</span>
              <span>👥 {members.length} membre{members.length > 1 ? 's' : ''}</span>
              <span>⚡ {team.eloTeam} Elo</span>
            </div>
            {team.description && <p className="text-gray-400 text-sm mt-2">{team.description}</p>}
          </div>
          <div className="flex gap-2 shrink-0 flex-col items-end">
            {isCap && (
              <button onClick={() => setEditModal(true)} className="btn-secondary text-sm py-1.5 px-3">
                ✏️ Modifier
              </button>
            )}
            <Link to={`/team/${team.id}`} className="text-xs text-gray-500 hover:text-white transition-colors">
              Voir la page publique →
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-dark-300/50">
          {[
            { label: 'Elo',       value: team.eloTeam, color: 'text-yellow-500' },
            { label: 'Victoires', value: team.wins,    color: 'text-green-400' },
            { label: 'Défaites',  value: team.losses,  color: 'text-red-400' },
            { label: 'Winrate',   value: `${winrate}%`, color: winrate >= 50 ? 'text-green-400' : 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-xl font-bold font-display ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Roster — slots */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold flex items-center gap-2">
            👥 Roster
            <span className="text-xs text-gray-500 font-normal">{members.length}/{teamSize} membres</span>
            <span className="text-xs font-normal px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,203,5,0.1)', color: '#FFCB05' }}>
              {MODE_LABELS[team.mode] || team.mode}
            </span>
          </h2>
          {isCap && emptySlots > 0 && (
            <button onClick={() => setInviteModal(true)} className="btn-primary text-sm py-1.5 px-4">
              + Inviter
            </button>
          )}
        </div>

        {/* Barre de progression du roster */}
        <div className="h-1.5 bg-dark-300 rounded-full mb-5 overflow-hidden">
          <div className="h-full bg-yellow-500 rounded-full transition-all"
            style={{ width: `${(members.length / teamSize) * 100}%` }} />
        </div>

        <div className="space-y-2">
          {/* Membres */}
          {members.map(m => (
            <MemberSlot key={m.id} member={m} isCaptainView={isCap} currentUserId={user?.id} onKick={handleKick} isOnline={!!onlineMap[m.userId]} />
          ))}

          {/* Slots vides — visibles uniquement pour le capitaine */}
          {isCap && Array.from({ length: emptySlots }).map((_, i) => (
            <EmptySlot key={`empty-${i}`} onClick={() => setInviteModal(true)} />
          ))}
        </div>
      </div>

      {/* Invitations en attente (capitaine seulement) */}
      {isCap && pendingInvitations.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold mb-4 text-yellow-500">⏳ Invitations envoyées ({pendingInvitations.length})</h2>
          <div className="space-y-2">
            {pendingInvitations.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 p-3 bg-dark-300/30 rounded-xl">
                <Avatar src={inv.receiver?.avatarUrl} username={inv.receiver?.username} size={36} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{inv.receiver?.username}</div>
                  <div className="text-xs text-gray-500">En attente de réponse</div>
                </div>
                <button onClick={() => handleCancelInvite(inv.id, inv.receiver?.username)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-2">
                  Annuler
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions bas de page */}
      <div className="flex gap-3">
        {!isCap && (
          <button onClick={handleLeave} className="btn-danger text-sm">
            🚪 Quitter l'équipe
          </button>
        )}
        {isCap && (
          <button onClick={handleDissolve} className="text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 px-4 py-2 rounded-lg transition-all">
            💀 Dissoudre l'équipe
          </button>
        )}
      </div>

      {/* Modal Inviter */}
      {inviteModal && (
        <Modal title="Inviter un joueur" onClose={() => { setInviteModal(false); setSearchQ(''); setSearchRes([]); }}>
          <div className="space-y-4">
            <div className="relative">
              <input
                ref={searchRef}
                autoFocus
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="input w-full pr-10"
                placeholder="Rechercher par pseudo..."
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Résultats */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchRes.length > 0 ? searchRes.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 bg-dark-300/40 rounded-xl hover:bg-dark-300/60 transition-colors">
                  <Avatar src={u.avatarUrl} username={u.username} size={36} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{u.username}</div>
                    <div className="text-xs text-gray-500">{u.eloGlobal} Elo · {u.region}</div>
                  </div>
                  <button
                    onClick={() => handleInvite(u.id, u.username)}
                    disabled={inviting === u.id}
                    className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50">
                    {inviting === u.id ? '...' : 'Inviter'}
                  </button>
                </div>
              )) : searchQ.length >= 2 && !searching ? (
                <div className="text-center text-gray-500 text-sm py-4">Aucun joueur trouvé pour "{searchQ}"</div>
              ) : searchQ.length < 2 ? (
                <div className="text-center text-gray-600 text-sm py-4">Tapez au moins 2 caractères</div>
              ) : null}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Éditer équipe */}
      {editModal && (
        <Modal title="Modifier l'équipe" onClose={() => setEditModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Nom de l'équipe</label>
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="input w-full" maxLength={30} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                className="input w-full resize-none h-20" maxLength={200} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Région</label>
              <div className="flex gap-2 flex-wrap">
                {REGIONS.map(r => (
                  <button key={r} type="button" onClick={() => setEditForm(f => ({ ...f, region: r }))}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${editForm.region === r ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500' : 'border-dark-300 text-gray-400'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleEditSave} className="btn-primary flex-1">Enregistrer</button>
              <button onClick={() => setEditModal(false)} className="btn-secondary flex-1">Annuler</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Panel pour un mode (2v2 ou 5v5) ─────────────────────────────────────────

function ModePanel({ mode, teamData, onRefresh }) {
  const modeLabel = MODE_LABELS[mode];
  const teamEntry = teamData?.[mode]; // { team, role } ou null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,203,5,0.15)', background: 'rgba(13,31,60,0.5)' }}>
      {/* En-tête du panel */}
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: 'rgba(255,203,5,0.05)', borderBottom: '1px solid rgba(255,203,5,0.12)' }}>
        <span className="text-2xl">{mode === 'TWO_V_TWO' ? '⚔️' : '🎮'}</span>
        <div>
          <h2 className="font-bold text-lg" style={{ color: '#FFCB05' }}>{modeLabel}</h2>
          <p className="text-xs text-gray-500">{TEAM_SIZES[mode]} joueurs par équipe</p>
        </div>
        {teamEntry && (
          <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
            Équipe active
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="p-5">
        {teamEntry ? (
          <TeamView team={teamEntry.team} role={teamEntry.role} onRefresh={onRefresh} />
        ) : (
          <CreateTeamForm onCreated={onRefresh} defaultMode={mode} />
        )}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function TeamManage() {
  const { user } = useAuthStore();
  // teamData = { TWO_V_TWO: { team, role } | null, FIVE_V_FIVE: { team, role } | null }
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await teamsApi.my();
      setTeamData(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const offKicked    = onWS('TEAM_KICKED',    () => load());
    const offDissolved = onWS('TEAM_DISSOLVED', () => load());
    const offAccepted  = onWS('TEAM_INVITE_ACCEPTED', () => load());
    return () => { offKicked(); offDissolved(); offAccepted(); };
  }, []);

  if (loading) return <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display font-bold text-4xl mb-1">
          <span className="text-gradient-yellow">Mes équipes</span>
        </h1>
        <p className="text-gray-400 text-sm">Gérez vos équipes 2v2 et 5v5 indépendamment.</p>
      </div>

      {/* Invitations reçues — toujours affichées en haut */}
      <ReceivedInvitations onAccepted={load} />

      {/* Deux panels côte à côte */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ModePanel mode="TWO_V_TWO"   teamData={teamData} onRefresh={load} />
        <ModePanel mode="FIVE_V_FIVE" teamData={teamData} onRefresh={load} />
      </div>
    </div>
  );
}
