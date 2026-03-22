import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(form.email, form.password);
    if (res.success) navigate('/');
    else setError(res.error || 'Erreur de connexion');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(180deg, #0a1e40 0%, #050d1a 60%)',
    }}>
      {/* BG glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(42,117,187,0.2) 0%, transparent 60%)' }} />

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden" style={{ background: 'linear-gradient(180deg, #e74c3c 50%, #fff 50%)' }}>
              <div className="w-full h-full flex items-center justify-center relative">
                <div className="w-10 h-0.5 bg-gray-900 absolute" style={{ top: '50%', transform: 'translateY(-50%)' }} />
                <div className="w-3 h-3 rounded-full bg-white border-2 border-gray-800 z-10" />
              </div>
            </div>
            <span className="font-bebas text-3xl tracking-widest">
              <span style={{ color: '#FFCB05' }}>Poké</span><span>lo</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Bienvenue !</h1>
          <p className="text-gray-400 mt-1 text-sm">Connectez-vous pour rejoindre la compétition</p>
        </div>

        {/* Card */}
        <div className="rounded-xl overflow-hidden" style={{
          background: 'linear-gradient(180deg, #0d1f3c 0%, #071428 100%)',
          border: '1px solid rgba(255,203,5,0.25)',
        }}>
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #FFCB05 50%, transparent)' }} />
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input" placeholder="ash@pokelo.gg" required autoComplete="email" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mot de passe</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input" placeholder="••••••••" required autoComplete="current-password" />
              </div>
              {error && (
                <div className="rounded-lg px-4 py-3 text-red-400 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-lg font-bebas tracking-widest text-lg mt-1">
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
            <div className="my-4 h-px" style={{ background: 'rgba(255,203,5,0.15)' }} />
            <p className="text-center text-sm text-gray-400">
              Pas encore de compte ?{' '}
              <Link to="/register" className="font-bold hover:text-yellow-400 transition-colors" style={{ color: '#FFCB05' }}>
                S'inscrire gratuitement
              </Link>
            </p>
          </div>
        </div>

        {/* Demo creds */}
        <div className="mt-4 rounded-lg p-3 text-xs" style={{ background: 'rgba(255,203,5,0.05)', border: '1px solid rgba(255,203,5,0.15)' }}>
          <p className="font-bold text-yellow-500 text-center mb-2 uppercase tracking-wider">Comptes de démo</p>
          <div className="grid grid-cols-2 gap-1 text-gray-400">
            <span className="text-gray-500">Admin:</span><span>admin@pokelo.gg</span>
            <span className="text-gray-500">Pass:</span><span>Admin1234!</span>
            <span className="text-gray-500">Joueur:</span><span>ash@pokelo.gg</span>
            <span className="text-gray-500">Pass:</span><span>Player1234!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
