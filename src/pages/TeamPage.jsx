import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teamsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import RankBadge from '../components/ui/RankBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteId, setInviteId] = useState('');

  const isMember  = team?.members?.some(m => m.userId === user?.id);
  const isCaptain = team?.members?.some(m => m.userId === user?.id && m.role === 'CAPTAIN');

  const load = () => {
    teamsApi.get(id).then(r => setTeam(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  const handleKick = async (targetId) => {
    if (!confirm('Retirer ce joueur ?')) return;
    try {
      await teamsApi.kick(id, targetId);
      toast.success('Joueur retiré');
      load();
    } catch {}
  };

  const handleLeave = async () => {
    if (!confirm('Quitter l\'équipe ?')) return;
    try {
      await teamsApi.leave(id);
      toast.success('Vous avez quitté l\'équipe');
      load();
    } catch {}
  };

  const handleInvite = async () => {
    if (!inviteId.trim()) return;
    try {
      await teamsApi.invite(id, inviteId.trim());
      toast.success('Invitation envoyée');
      setInviteModal(false);
      setInviteId('');
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>;
  if (!team) return <div className="text-center py-32 text-gray-400">Équipe introuvable</div>;

  const winrate = team.wins + team.losses > 0 ? Math.round(team.wins / (team.wins + team.losses) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      {/* Header */}
      <div className="card p-6 mb-6" style={{ background: 'linear-gradient(135deg, rgba(42,117,187,0.1), rgba(255,203,5,0.05))' }}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-dark-300 flex items-center justify-center text-xl font-bold text-yellow-500 border border-yellow-500/30">
            [{team.tag}]
          </div>
          <div className="flex-1">
            <h1 className="font-display font-bold text-3xl mb-1">{team.name}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-2">
              <span>🌍 {team.region}</span>
              <span>👥 {team.members?.length} membres</span>
              <span>⚡ {team.eloTeam} Elo</span>
            </div>
            {team.description && <p className="text-gray-400 text-sm">{team.description}</p>}
          </div>
          <div className="flex flex-col gap-2">
            {isCaptain && <button onClick={() => setInviteModal(true)} className="btn-primary text-sm py-2">+ Inviter</button>}
            {isMember && !isCaptain && <button onClick={handleLeave} className="btn-danger text-sm py-2">Quitter</button>}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-dark-300">
          {[
            { label: 'Elo', value: team.eloTeam, color: 'text-yellow-500' },
            { label: 'Victoires', value: team.wins, color: 'text-green-400' },
            { label: 'Défaites', value: team.losses, color: 'text-red-400' },
            { label: 'Winrate', value: `${winrate}%`, color: winrate >= 50 ? 'text-green-400' : 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-xl font-bold font-display ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Members */}
      <div className="card p-5">
        <h2 className="font-bold mb-4">👥 Membres ({team.members?.length})</h2>
        <div className="space-y-2">
          {team.members?.map(member => (
            <div key={member.id} className="flex items-center gap-3 p-3 hover:bg-dark-300/50 rounded-lg transition-colors">
              <Avatar src={member.user?.avatarUrl} username={member.user?.username} size={40} />
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${member.userId}`} className="font-semibold text-sm hover:text-yellow-400 transition-colors">
                  {member.user?.username}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  {member.role === 'CAPTAIN' && <span className="badge bg-yellow-500/10 text-yellow-500">👑 Capitaine</span>}
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-yellow-500">{member.user?.eloGlobal}</div>
                  <div className="text-xs text-gray-500">Elo</div>
                </div>
                <div className="text-xs text-gray-500">
                  {member.user?.wins}W / {member.user?.losses}L
                </div>
              </div>
              {isCaptain && member.userId !== user?.id && (
                <button onClick={() => handleKick(member.userId)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 hover:bg-red-500/10 rounded transition-colors">
                  Kick
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      <Modal isOpen={inviteModal} onClose={() => setInviteModal(false)} title="Inviter un joueur">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">ID du joueur</label>
            <input value={inviteId} onChange={e => setInviteId(e.target.value)} className="input" placeholder="UUID du joueur..." />
            <p className="text-xs text-gray-500 mt-1">Vous trouverez l'ID dans l'URL du profil du joueur.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleInvite} className="btn-primary flex-1">Envoyer l'invitation</button>
            <button onClick={() => setInviteModal(false)} className="btn-ghost">Annuler</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
