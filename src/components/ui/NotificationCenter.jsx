import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)  return 'à l\'instant';
  if (diff < 3600_000) return `il y a ${Math.floor(diff / 60_000)}min`;
  if (diff < 86400_000) return `il y a ${Math.floor(diff / 3600_000)}h`;
  return `il y a ${Math.floor(diff / 86400_000)}j`;
}

function NotificationIcon({ type }) {
  const icons = {
    TEAM_INVITATION:      '📬',
    TEAM_INVITE_ACCEPTED: '✅',
    TEAM_KICKED:          '🚫',
    TEAM_DISSOLVED:       '💥',
    MATCH_FOUND:          '🎮',
    MATCH_STARTED:        '⚔️',
    MATCH_RESULT:         '🏆',
    MATCH_CANCELLED:      '❌',
    SCORE_SUBMITTED:      '📋',
    MATCH_DISPUTED:       '⚠️',
    REQUEUED:             '🔄',
  };
  return <span className="text-lg">{icons[type] || '🔔'}</span>;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, remove, acceptInvitation, declineInvitation } = useNotificationStore();

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
        className="relative p-2 rounded-lg transition-colors hover:bg-white/5 text-gray-300 hover:text-white"
        title="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-80 z-20 rounded-xl overflow-hidden animate-slide-up"
            style={{ background: '#0d1f3c', border: '1px solid rgba(255,203,5,0.25)', maxHeight: '420px' }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,203,5,0.15)' }}>
              <span className="font-bold text-sm">Notifications</span>
              {notifications.length > 0 && (
                <button
                  onClick={() => useNotificationStore.getState().clear()}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Tout effacer
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  Aucune notification
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
                      <NotificationIcon type={notif.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 leading-snug">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{timeAgo(notif.createdAt)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(notif.id); }}
                        className="text-gray-600 hover:text-gray-400 text-xs shrink-0"
                      >✕</button>
                    </div>

                    {/* Actions inline pour les invitations d'équipe */}
                    {notif.type === 'TEAM_INVITATION' && notif.invitationId && (
                      <div className="flex gap-2 mt-2 ml-7">
                        <button
                          onClick={() => acceptInvitation(notif.invitationId, notif.id)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-white transition-colors"
                          style={{ background: '#22c55e' }}
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => declineInvitation(notif.invitationId, notif.id)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                          style={{ background: 'rgba(255,255,255,0.08)' }}
                        >
                          Refuser
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
