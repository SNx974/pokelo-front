import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchesApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import MatchChat from '../components/match/MatchChat';
import { onWS } from '../services/websocket';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MatchPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [disputeDesc, setDisputeDesc] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const load = () => {
    matchesApi.get(id).then(r => setMatch(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();

    // Écouter les événements WS pour mettre à jour la page en temps réel
    const offScore = onWS('SCORE_SUBMITTED', (data) => {
      if (data.matchId === id) load();
    });
    const offResult = onWS('MATCH_RESULT', (data) => {
      if (data.matchId === id) load();
    });
    const offDisputed = onWS('MATCH_DISPUTED', (data) => {
      if (data.matchId === id) {
        toast.error('⚠️ Scores divergents — litige créé.');
        load();
      }
    });

    return () => { offScore(); offResult(); offDisputed(); };
  }, [id]);

  const myParticipant = match?.participants?.find(p => p.userId === user?.id);
  const isParticipant = !!myParticipant;
  const myTeamSide = myParticipant?.team;

  // Vérifier si mon équipe a déjà soumis
  const mySubmission = match?.scoreSubmissions?.find(s => s.teamSide === myTeamSide);
  const otherSubmission = match?.scoreSubmissions?.find(s => s.teamSide !== myTeamSide);

  const submitResult = async (winnerTeam) => {
    if (!confirm(`Confirmer la victoire de l'Équipe ${winnerTeam} ?`)) return;
    setSubmitting(true);
    try {
      const { data } = await matchesApi.submitResult(id, winnerTeam);
      toast.success(data.message);
      load();
    } catch {} finally { setSubmitting(false); }
  };

  const submitDispute = async () => {
    if (!disputeDesc.trim()) return;
    try {
      await matchesApi.createDispute(id, disputeDesc);
      toast.success('Litige créé, l\'équipe admin va examiner.');
      setShowDisputeForm(false);
      load();
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>;
  if (!match) return <div className="text-center py-32 text-gray-400">Match introuvable</div>;

  const team1 = match.participants?.filter(p => p.team === 1) || [];
  const team2 = match.participants?.filter(p => p.team === 2) || [];

  const statusColors = {
    PENDING:    'bg-gray-500/20 text-gray-400',
    IN_PROGRESS:'bg-blue-500/20 text-blue-400',
    COMPLETED:  'bg-green-500/20 text-green-400',
    DISPUTED:   'bg-red-500/20 text-red-400',
    CANCELLED:  'bg-gray-500/20 text-gray-500',
  };

  const TeamSide = ({ players, side, isWinner }) => (
    <div className={`flex-1 card p-5 ${isWinner ? 'border-yellow-500/40 shadow-glow-yellow' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold font-display text-lg">Équipe {side}</h3>
        {isWinner && <span className="badge bg-yellow-500/20 text-yellow-500">🏆 Victoire</span>}
        {match.status === 'COMPLETED' && !isWinner && <span className="badge bg-red-500/20 text-red-400">Défaite</span>}
      </div>
      <div className="space-y-3">
        {players.map(p => (
          <Link key={p.id} to={`/profile/${p.userId}`} className="flex items-center gap-3 hover:bg-dark-300/50 p-2 rounded-lg transition-colors">
            <Avatar src={p.user?.avatarUrl} username={p.user?.username} size={36} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{p.user?.username}</div>
              <div className="text-xs text-gray-500">{p.eloBefore} Elo</div>
            </div>
            {match.status === 'COMPLETED' && p.eloChange !== undefined && (
              <div className={`text-sm font-bold ${p.eloChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {p.eloChange >= 0 ? '+' : ''}{p.eloChange}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );

  // Section de validation des scores
  const ScoreValidation = () => {
    const sub1 = match.scoreSubmissions?.find(s => s.teamSide === 1);
    const sub2 = match.scoreSubmissions?.find(s => s.teamSide === 2);

    return (
      <div className="card p-5 mb-4">
        <h2 className="font-bold mb-4">🏆 Validation du résultat</h2>
        <p className="text-sm text-gray-400 mb-4">
          1 joueur de chaque équipe doit soumettre le résultat. Si les deux équipes s'accordent, le match est validé automatiquement.
        </p>

        {/* Statut des soumissions */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[1, 2].map(side => {
            const sub = side === 1 ? sub1 : sub2;
            return (
              <div key={side} className={`rounded-lg p-3 border ${sub ? 'border-green-500/30 bg-green-500/5' : 'border-dark-300 bg-dark-300/30'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${sub ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <span className="text-sm font-semibold">Équipe {side}</span>
                </div>
                {sub ? (
                  <div className="text-xs text-gray-400">
                    <span className="text-green-400">✓ Soumis</span> par {sub.user?.username}<br />
                    Victoire déclarée : <span className="text-yellow-500 font-bold">Équipe {sub.winnerTeam}</span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">En attente...</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Boutons de soumission pour le joueur connecté */}
        {isParticipant && !mySubmission && (
          <div>
            <p className="text-xs text-gray-500 mb-3">Vous jouez dans l'<strong>Équipe {myTeamSide}</strong>. Déclarez le vainqueur :</p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => submitResult(1)} disabled={submitting} className="btn-primary flex-1">
                Victoire Équipe 1
              </button>
              <button onClick={() => submitResult(2)} disabled={submitting} className="btn-secondary flex-1">
                Victoire Équipe 2
              </button>
            </div>
          </div>
        )}

        {isParticipant && mySubmission && !sub1 || isParticipant && mySubmission && !sub2 ? (
          <div className="mt-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg text-sm text-yellow-400">
            ⏳ Votre score a été soumis. En attente de l'autre équipe...
            <div className="text-xs text-gray-500 mt-1">
              Si l'autre équipe ne répond pas sous 3 minutes, votre résultat sera accepté automatiquement.
            </div>
          </div>
        ) : null}

        {/* Dispute manuelle */}
        {isParticipant && (
          <div className="mt-4">
            <button
              onClick={() => setShowDisputeForm(!showDisputeForm)}
              className="text-sm text-gray-500 hover:text-yellow-500 transition-colors"
            >
              ⚠️ Signaler un problème
            </button>
            {showDisputeForm && (
              <div className="mt-3 space-y-3">
                <textarea
                  value={disputeDesc}
                  onChange={e => setDisputeDesc(e.target.value)}
                  className="input resize-none h-24"
                  placeholder="Décrivez le problème..."
                />
                <button onClick={submitDispute} className="btn-danger text-sm">Créer un litige</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      {/* Header */}
      <div className="card p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display font-bold text-2xl">Match</h1>
              <span className={`badge ${statusColors[match.status]}`}>
                {match.status === 'PENDING'     && '⏳ En attente'}
                {match.status === 'IN_PROGRESS' && '🔵 En cours'}
                {match.status === 'COMPLETED'   && '✅ Terminé'}
                {match.status === 'DISPUTED'    && '⚠️ En litige'}
                {match.status === 'CANCELLED'   && '❌ Annulé'}
              </span>
            </div>
            <div className="flex gap-3 text-sm text-gray-400">
              <span>{match.mode === 'TWO_V_TWO' ? '⚔️ 2v2' : '🎮 5v5'}</span>
              <span>{match.queueType === 'SOLO' ? '👤 Solo' : '🛡️ Team'}</span>
              {match.startedAt && <span>📅 {format(new Date(match.startedAt), 'dd MMM HH:mm', { locale: fr })}</span>}
            </div>
          </div>
          <div className="text-xs text-gray-500 font-mono">ID: {match.id.slice(0, 8)}...</div>
        </div>
      </div>

      {/* Teams */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-stretch">
        <TeamSide players={team1} side={1} isWinner={match.winnerSide === 1} />
        <div className="flex items-center justify-center font-display font-bold text-2xl text-gray-600 px-4">VS</div>
        <TeamSide players={team2} side={2} isWinner={match.winnerSide === 2} />
      </div>

      {/* Validation des scores */}
      {match.status === 'IN_PROGRESS' && <ScoreValidation />}

      {/* Match terminé */}
      {match.status === 'COMPLETED' && (
        <div className="card p-5 bg-green-500/5 border-green-500/20 mb-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="font-bold text-lg">Match terminé</div>
            <div className="text-gray-400 text-sm mt-1">
              L'Équipe {match.winnerSide} remporte la victoire
              {match.completedAt && ` · ${format(new Date(match.completedAt), 'dd MMM HH:mm', { locale: fr })}`}
            </div>
          </div>
        </div>
      )}

      {/* Litige */}
      {match.dispute && (
        <div className="card p-5 border-red-500/30 bg-red-500/5 mb-4">
          <h2 className="font-bold text-red-400 mb-2">⚠️ Litige en cours</h2>
          <p className="text-gray-400 text-sm">{match.dispute.description}</p>
          <span className={`badge mt-2 ${match.dispute.status === 'OPEN' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
            {match.dispute.status}
          </span>
        </div>
      )}

      {/* Chat — réservé aux participants */}
      {isParticipant && (match.status === 'IN_PROGRESS' || match.status === 'DISPUTED') && (
        <MatchChat matchId={id} />
      )}
    </div>
  );
}
