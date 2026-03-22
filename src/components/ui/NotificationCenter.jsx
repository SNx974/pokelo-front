import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';
import {
  Bell, X, Trash2, CheckCheck,
  Mail, UserCheck, UserX, Zap, Swords, Trophy,
  AlertTriangle, ClipboardList, RefreshCw, Ban,
} from 'lucide-react';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)   return 'à l\'instant';
  if (diff < 3600_000) return `il y a ${Math.floor(diff / 60_000)}min`;
  if (diff < 86400_000) return `il y a ${Math.floor(diff / 3600_000)}h`;
  return `il y a ${Math.floor(diff / 86400_000)}j`;
}

function NotifIcon({ type }) {
  const props = { size: 15, className: 'shrink-0 mt-0.5' };
  switch (type) {
    case 'TEAM_INVITATION':      return <Mail {...props} className="shrink-0 mt-0.5 text-yellow-400" />;
    case 'TEAM_INVITE_ACCEPTED': return <UserCheck {...props} className="shrink-0 mt-0.5 text-green-400" />;
    case 'TEAM_KICKED':          return <UserX {...props} className="shrink-0 mt-0.5 text-red-400" />;
    case 'TEAM_DISSOLVED':       return <Ban {...props} className="shrink-0 mt-0.5 text-red-500" />;
    case 'MATCH_FOUND':          return <Zap {...props} className="shrink-0 mt-0.5 text-yellow-400" />;
    case 'MATCH_STARTED':        return <Swords {...props} className="shrink-0 mt-0.5 text-blue-400" />;
    case 'MATCH_RESULT':         return <Trophy {...props} className="shrink-0 mt-0.5 text-yellow-500" />;
    case 'MATCH_CANCELLED':      return <X {...props} className="shrink-0 mt-0.5 text-red-400" />;
    case 'MATCH_DISPUTED':       return <AlertTriangle {...props} className="shrink-0 mt-0.5 text-orange-400" />;
    case 'SCORE_SUBMITTED':      return <ClipboardList {...props} className="shrink-0 mt-0.5 text-blue-400" />;
    case 'REQUEUED':             return <RefreshCw {...props} className="shrink-0 mt-0.5 text-gray-400" />;
    default:                     return <Bell {...props} className="shrink-0 mt-0.5 text-gray-400" />;
  }
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, remove, clear, acceptInvitation, declineInvitation } = useNotificationStore();

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open && unreadCount > 0) markAllRead();
  };

  const handleClick = (notif) => {
    if (notif.matchId) {
      navigate(`/match/${notif.matchId}`);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg transition-colors hover:bg-white/5 text-gray-400 hover:text-white"
        title="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-80 z-20 rounded-xl overflow-hidden animate-slide-up"
            style={{ background: '#0d1f3c', border: '1px solid rgba(255,203,5,0.25)', maxHeight: '420px', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(255,203,5,0.15)' }}>
              <span className="font-bold text-sm flex items-center gap-2">
                <Bell size={14} className="text-yellow-500" /> Notifications
              </span>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    <button onClick={markAllRead} className="text-gray-500 hover:text-gray-300 transition-colors" title="Tout marquer comme lu">
                      <CheckCheck size={14} />
                    </button>
                    <button onClick={clear} className="text-gray-500 hover:text-red-400 transition-colors" title="Tout effacer">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell size={28} className="mx-auto mb-2 text-gray-700" />
                  <p className="text-gray-500 text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 transition-colors ${!notif.read ? 'bg-yellow-500/5' : ''}`}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className={`flex items-start gap-3 ${notif.matchId ? 'cursor-pointer hover:opacity-80' : ''}`}
                      onClick={() => handleClick(notif)}
                    >
                      <NotifIcon type={notif.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-200 leading-snug">{notif.message}</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">{timeAgo(notif.createdAt)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(notif.id); }}
                        className="text-gray-700 hover:text-gray-400 transition-colors shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    {/* Actions inline pour les invitations d'équipe */}
                    {notif.type === 'TEAM_INVITATION' && notif.invitationId && (
                      <div className="flex gap-2 mt-2 ml-6">
                        <button
                          onClick={() => acceptInvitation(notif.invitationId, notif.id)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-white transition-colors"
                          style={{ background: '#22c55e' }}
                        >
                          <UserCheck size={11} /> Accepter
                        </button>
                        <button
                          onClick={() => declineInvitation(notif.invitationId, notif.id)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                          style={{ background: 'rgba(255,255,255,0.08)' }}
                        >
                          <X size={11} /> Refuser
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
