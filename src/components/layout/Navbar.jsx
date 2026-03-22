import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { teamsApi } from '../../services/api';
import { onWS } from '../../services/websocket';
import Avatar from '../ui/Avatar';
import NotificationCenter from '../ui/NotificationCenter';
import {
  Home, Trophy, Swords, User, Shield, ShieldAlert,
  LogOut, ChevronDown, Settings, Wifi, WifiOff,
} from 'lucide-react';
import { SiPokemon } from '@icons-pack/react-simple-icons';

const navLinks = [
  { to: '/',            label: 'Accueil',   end: true,  Icon: Home },
  { to: '/ladder',      label: 'Ladder',    end: false, Icon: Trophy },
  { to: '/matchmaking', label: 'Jouer',     end: false, Icon: Swords },
];

export default function Navbar() {
  const { user, logout, wsConnected } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState(0);

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
        <Link to="/" className="flex items-center gap-2 mr-8 shrink-0">
          <SiPokemon size={22} style={{ color: '#FFCB05' }} />
          <span className="font-bebas text-2xl tracking-wider" style={{ letterSpacing: '0.05em' }}>
            <span style={{ color: '#FFCB05' }}>Poké</span><span style={{ color: '#fff' }}>lo</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map(({ to, label, end, Icon }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold transition-all relative ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={14} />
                  {label}
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#FFCB05' }} />}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* WS status */}
              {wsConnected
                ? <Wifi size={14} className="hidden md:block text-green-400" title="En ligne" />
                : <WifiOff size={14} className="hidden md:block text-gray-600" title="Hors ligne" />
              }

              {/* Notification center */}
              <NotificationCenter />

              {/* Profile dropdown */}
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5">
                  <div className="relative">
                    <Avatar src={user.avatarUrl} username={user.username} size={28} />
                    {pendingInvites > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
                        {pendingInvites > 9 ? '9+' : pendingInvites}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold hidden md:block">{user.username}</span>
                  <ChevronDown size={12} className="hidden md:block text-gray-500" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 z-20 rounded-xl overflow-hidden animate-slide-up"
                      style={{ background: '#0d1f3c', border: '1px solid rgba(255,203,5,0.25)' }}>

                      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,203,5,0.15)' }}>
                        <div className="font-bold text-sm">{user.username}</div>
                        <div className="text-xs text-yellow-500 mt-0.5 flex items-center gap-1">
                          <Trophy size={11} /> {user.eloGlobal} Elo
                        </div>
                      </div>

                      <div className="py-1">
                        <Link to={`/profile/${user.id}`}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          onClick={() => setProfileOpen(false)}>
                          <User size={14} /> Mon profil
                        </Link>

                        <Link to="/team/manage"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          onClick={() => setProfileOpen(false)}>
                          <Shield size={14} />
                          <span>Mon équipe</span>
                          {pendingInvites > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {pendingInvites}
                            </span>
                          )}
                        </Link>

                        <Link to="/matchmaking"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          onClick={() => setProfileOpen(false)}>
                          <Swords size={14} /> Jouer
                        </Link>

                        {['ADMIN', 'MODERATOR'].includes(user.role) && (
                          <Link to="/admin"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-yellow-500 hover:bg-yellow-500/10 transition-colors"
                            onClick={() => setProfileOpen(false)}>
                            <ShieldAlert size={14} /> Panel Admin
                          </Link>
                        )}

                        <div className="my-1 mx-4 h-px" style={{ background: 'rgba(255,203,5,0.15)' }} />

                        <button
                          onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full text-left">
                          <LogOut size={14} /> Déconnexion
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
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden py-3 px-4 animate-slide-up" style={{ borderTop: '1px solid rgba(255,203,5,0.15)', background: '#0d1f3c' }}>
          {navLinks.map(({ to, label, end, Icon }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg mb-1 text-sm font-semibold ${isActive ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-300'}`
              }
              onClick={() => setMenuOpen(false)}>
              <Icon size={15} /> {label}
            </NavLink>
          ))}
          {user && (
            <>
              <Link to="/team/manage" className="flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 text-sm font-semibold text-gray-300"
                onClick={() => setMenuOpen(false)}>
                <span className="flex items-center gap-2"><Shield size={15} /> Mon équipe</span>
                {pendingInvites > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingInvites}</span>}
              </Link>
              <Link to={`/profile/${user.id}`} className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-1 text-sm font-semibold text-gray-300" onClick={() => setMenuOpen(false)}>
                <User size={15} /> Mon profil
              </Link>
              <button onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-1 text-sm font-semibold text-red-400 w-full text-left">
                <LogOut size={15} /> Déconnexion
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
