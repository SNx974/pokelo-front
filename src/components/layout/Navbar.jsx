import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { teamsApi } from '../../services/api';
import { onWS } from '../../services/websocket';
import Avatar from '../ui/Avatar';
import NotificationCenter from '../ui/NotificationCenter';

const navLinks = [
  { to: '/',            label: 'Accueil',   end: true },
  { to: '/ladder',      label: 'Ladder',    end: false },
  { to: '/matchmaking', label: 'Jouer',     end: false },
];

export default function Navbar() {
  const { user, logout, wsConnected } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState(0);

  // Charge le nombre d'invitations en attente
  const fetchInvites = async () => {
    if (!user) return;
    try {
      const { data } = await teamsApi.myInvitations();
      setPendingInvites(data.length);
    } catch {}
  };

  useEffect(() => {
    if (!user) { setPendingInvites(0); return; }
    fetchInvites();

    // Mise à jour en temps réel via WS
    const offInvite   = onWS('TEAM_INVITATION',     () => fetchInvites());
    const offAccepted = onWS('TEAM_INVITE_ACCEPTED', () => fetchInvites());

    return () => { offInvite(); offAccepted(); };
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40" style={{
      background: 'linear-gradient(180deg, rgba(5,13,26,0.98) 0%, rgba(5,13,26,0.92) 100%)',
      borderBottom: '1px solid rgba(255,203,5,0.2)',
      backdropFilter: 'blur(12px)',
    }}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 mr-8 shrink-0">
          <div className="relative w-8 h-8">
            <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden relative"
              style={{ background: 'linear-gradient(180deg, #e74c3c 50%, #fff 50%)' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-0.5 bg-gray-900" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)' }} />
                <div className="w-3 h-3 rounded-full bg-white border-2 border-gray-800 z-10" />
              </div>
            </div>
          </div>
          <span className="font-bebas text-2xl tracking-wider" style={{ letterSpacing: '0.05em' }}>
            <span style={{ color: '#FFCB05' }}>Poké</span><span style={{ color: '#fff' }}>lo</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end}
              className={({ isActive }) =>
                `px-4 py-1.5 text-sm font-semibold transition-all relative ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`
              }>
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#FFCB05' }} />}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className={`w-2 h-2 rounded-full hidden md:block ${wsConnected ? 'bg-green-400' : 'bg-gray-600'}`}
                title={wsConnected ? 'En ligne' : 'Hors ligne'} />

              {/* Centre de notifications */}
              <NotificationCenter />

              {/* Profile dropdown */}
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5">
                  <div className="relative">
                    <Avatar src={user.avatarUrl} username={user.username} size={30} />
                    {pendingInvites > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                        {pendingInvites > 9 ? '9+' : pendingInvites}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold hidden md:block">{user.username}</span>
                  <span className="hidden md:block text-gray-600 text-xs">▾</span>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 z-20 rounded-xl overflow-hidden animate-slide-up"
                      style={{ background: '#0d1f3c', border: '1px solid rgba(255,203,5,0.25)' }}>

                      {/* Header */}
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,203,5,0.15)' }}>
                        <div className="font-bold text-sm">{user.username}</div>
                        <div className="text-xs text-yellow-500 mt-0.5">⚡ {user.eloGlobal} Elo</div>
                      </div>

                      <div className="py-1">
                        <Link to={`/profile/${user.id}`}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          onClick={() => setProfileOpen(false)}>
                          👤 Mon profil
                        </Link>

                        {/* Mon équipe avec badge */}
                        <Link to="/team/manage"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          onClick={() => setProfileOpen(false)}>
                          <span>🛡️ Mon équipe</span>
                          {pendingInvites > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                              {pendingInvites}
                            </span>
                          )}
                        </Link>

                        <Link to="/matchmaking"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          onClick={() => setProfileOpen(false)}>
                          ⚔️ Jouer
                        </Link>

                        {['ADMIN', 'MODERATOR'].includes(user.role) && (
                          <Link to="/admin"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-yellow-500 hover:bg-yellow-500/10 transition-colors"
                            onClick={() => setProfileOpen(false)}>
                            🛡️ Panel Admin
                          </Link>
                        )}

                        <div className="my-1 mx-4 h-px" style={{ background: 'rgba(255,203,5,0.15)' }} />

                        <button
                          onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full text-left">
                          🚪 Déconnexion
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-1.5 text-sm font-semibold text-gray-300 hover:text-white transition-colors">
                Connexion
              </Link>
              <Link to="/register" className="btn-primary px-5 py-1.5 text-sm rounded-full">
                S'inscrire
              </Link>
            </div>
          )}

          {/* Mobile burger */}
          <button className="md:hidden text-gray-400 hover:text-white text-xl" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden py-3 px-4 animate-slide-up" style={{ borderTop: '1px solid rgba(255,203,5,0.15)', background: '#0d1f3c' }}>
          {navLinks.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg mb-1 text-sm font-semibold ${isActive ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-300'}`
              }
              onClick={() => setMenuOpen(false)}>
              {link.label}
            </NavLink>
          ))}
          {user && (
            <>
              <Link to="/team/manage" className="flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 text-sm font-semibold text-gray-300"
                onClick={() => setMenuOpen(false)}>
                <span>🛡️ Mon équipe</span>
                {pendingInvites > 0 && <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingInvites}</span>}
              </Link>
              <Link to={`/profile/${user.id}`} className="block px-3 py-2.5 rounded-lg mb-1 text-sm font-semibold text-gray-300" onClick={() => setMenuOpen(false)}>
                👤 Mon profil
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
