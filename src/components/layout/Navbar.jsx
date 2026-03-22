import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../ui/Avatar';

const navLinks = [
  { to: '/',            label: 'Accueil',   end: true },
  { to: '/ladder',      label: 'Ladder',    end: false },
  { to: '/teams',       label: 'Équipes',   end: false },
  { to: '/tournaments', label: 'Tournois',  end: false },
];

export default function Navbar() {
  const { user, logout, wsConnected } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40" style={{
      background: 'linear-gradient(180deg, rgba(5,13,26,0.98) 0%, rgba(5,13,26,0.92) 100%)',
      borderBottom: '1px solid rgba(255,203,5,0.2)',
      backdropFilter: 'blur(12px)',
    }}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 mr-8 shrink-0">
          {/* Pokéball icon */}
          <div className="relative w-8 h-8">
            <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden relative" style={{ background: 'linear-gradient(180deg, #e74c3c 50%, #fff 50%)' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-0.5 bg-gray-900" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)' }} />
                <div className="w-3 h-3 rounded-full bg-white border-2 border-gray-800 z-10" style={{ background: '#fff' }} />
              </div>
            </div>
          </div>
          <span className="font-bebas text-2xl tracking-wider" style={{ letterSpacing: '0.05em' }}>
            <span style={{ color: '#FFCB05' }}>Poké</span><span style={{ color: '#fff' }}>lo</span>
          </span>
        </Link>

        {/* Desktop Nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `px-4 py-1.5 text-sm font-semibold transition-all relative ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#FFCB05' }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Actualités CTA */}
          <Link to="/news" className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #FFCB05, #F59E0B)', color: '#050d1a', boxShadow: '0 3px 12px rgba(255,203,5,0.35)' }}>
            <span>+</span> Actualités
          </Link>

          {user ? (
            <>
              {/* WS dot */}
              <div className={`w-2 h-2 rounded-full hidden md:block ${wsConnected ? 'bg-green-400' : 'bg-gray-600'}`}
                title={wsConnected ? 'En ligne' : 'Hors ligne'} />

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
                >
                  <Avatar src={user.avatarUrl} username={user.username} size={30} />
                  <span className="text-sm font-semibold hidden md:block">{user.username}</span>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 z-20 rounded-xl overflow-hidden animate-slide-up"
                      style={{ background: '#0d1f3c', border: '1px solid rgba(255,203,5,0.25)' }}>
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,203,5,0.15)' }}>
                        <div className="font-bold text-sm">{user.username}</div>
                        <div className="text-xs text-yellow-500 mt-0.5">⚡ {user.eloGlobal} Elo</div>
                      </div>
                      <div className="py-1">
                        <Link to={`/profile/${user.id}`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors" onClick={() => setProfileOpen(false)}>
                          👤 Mon profil
                        </Link>
                        <Link to="/matchmaking" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors" onClick={() => setProfileOpen(false)}>
                          ⚔️ Jouer
                        </Link>
                        {user.role === 'ADMIN' && (
                          <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-yellow-500 hover:bg-yellow-500/10 transition-colors" onClick={() => setProfileOpen(false)}>
                            🛡️ Panel Admin
                          </Link>
                        )}
                        <div className="my-1 mx-4 h-px" style={{ background: 'rgba(255,203,5,0.15)' }} />
                        <button onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full text-left">
                          🚪 Déconnexion
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Settings icon */}
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-lg">
                ⚙️
              </button>
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

          {/* Mobile menu */}
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
              className={({ isActive }) => `block px-3 py-2.5 rounded-lg mb-1 text-sm font-semibold ${isActive ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-300'}`}
              onClick={() => setMenuOpen(false)}>
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
