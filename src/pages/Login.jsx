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
    <div className="min-h-screen bg-dark flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at top, #1a2035 0%, #0D0F14 60%)' }}>
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-4xl">⚡</span>
            <span className="font-display font-bold text-3xl">
              <span className="text-gradient-yellow">Poké</span>
              <span className="text-white">lo</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Bienvenue !</h1>
          <p className="text-gray-400 mt-1">Connectez-vous pour rejoindre la compétition</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input"
                placeholder="ash@pokelo.gg"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="neon-line mt-5 mb-4" />

          <p className="text-center text-sm text-gray-400">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-yellow-500 hover:text-yellow-400 font-medium">
              S'inscrire
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 card p-4 border-yellow-500/20">
          <p className="text-xs text-gray-500 text-center mb-2 font-medium">COMPTES DE DÉMONSTRATION</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div><span className="text-gray-500">Admin:</span> admin@pokelo.gg</div>
            <div><span className="text-gray-500">Pass:</span> Admin1234!</div>
            <div><span className="text-gray-500">Joueur:</span> ash@pokelo.gg</div>
            <div><span className="text-gray-500">Pass:</span> Player1234!</div>
          </div>
        </div>
      </div>
    </div>
  );
}
