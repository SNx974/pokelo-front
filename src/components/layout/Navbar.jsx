import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../ui/Avatar';

const navLinks = [
  { to: '/',           label: 'Accueil',    icon: '🏠' },
  { to: '/ladder',     label: 'Ladder',     icon: '🏆' },
  { to: '/matchmaking',label: 'Jouer',      icon: '⚔️' },
];

export default function Navbar() {
  const { user, logout, wsConnected } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-dark-100/95 backdrop-blur-md border-b border-dark-300">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl">⚡</span>
          <span className="font-display font-bold text-xl tracking-wide">
            <span className="text-gradient-yellow">Poké</span>
            <span className="text-white">lo</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-yellow-500/10 text-yellow-500'
                    : 'text-gray-400 hover:text-white hover:bg-dark-300'
                }`
              }
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* WS indicator */}
          {user && (
            <div className="hidden md:flex items-center gap-1.5" title={wsConnected ? 'Connecté' : 'Déconnecté'}>
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
            </div>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 bg-dark-300 hover:bg-dark-400 rounded-lg px-3 py-1.5 transition-colors"
              >
                <Avatar src={user.avatarUrl} username={user.username} size={28} />
                <span className="text-sm font-medium hidden md:block">{user.username}</span>
                <span className="text-xs text-yellow-500 hidden md:block">{user.eloGlobal}</span>
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 card z-20 py-1 animate-slide-up">
                    <Link to={`/profile/${user.id}`} className="flex items-center gap-2 px-4 py-2.5 hover:bg-dark-300 transition-colors text-sm" onClick={() => setProfileOpen(false)}>
                      <span>👤</span> Mon profil
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 hover:bg-dark-300 transition-colors text-sm text-yellow-500" onClick={() => setProfileOpen(false)}>
                        <span>🛡️</span> Panel Admin
                      </Link>
                    )}
                    <div className="neon-line my-1 mx-4" />
                    <button onClick={() => { logout(); setProfileOpen(false); navigate('/'); }} className="flex items-center gap-2 px-4 py-2.5 hover:bg-dark-300 transition-colors text-sm text-red-400 w-full text-left">
                      <span>🚪</span> Déconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm py-2 px-4">Connexion</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">S'inscrire</Link>
            </div>
          )}

          {/* Mobile menu */}
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-dark-100 border-t border-dark-300 py-2 px-4 animate-slide-up">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-1 ${isActive ? 'bg-yellow-500/10 text-yellow-500' : 'text-gray-300'}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <span>{link.icon}</span> {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
