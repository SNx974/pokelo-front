import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const REGIONS = [
  { value: 'EU', label: '🇪🇺 Europe' },
  { value: 'NA', label: '🇺🇸 Amérique du Nord' },
  { value: 'ASIA', label: '🌏 Asie' },
  { value: 'OCE', label: '🌊 Océanie' },
  { value: 'SA', label: '🌎 Amérique du Sud' },
];

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', region: 'EU' });
  const [errors, setErrors] = useState({});
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.username.match(/^[a-zA-Z0-9_-]{3,20}$/)) e.username = 'Pseudo 3-20 caractères (lettres, chiffres, _ -)';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email invalide';
    if (form.password.length < 8) e.password = 'Minimum 8 caractères';
    if (!form.password.match(/(?=.*[A-Z])(?=.*[0-9])/)) e.password = '1 majuscule et 1 chiffre requis';
    if (form.password !== form.confirm) e.confirm = 'Mots de passe différents';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const res = await register({ username: form.username, email: form.email, password: form.password, region: form.region });
    if (res.success) navigate('/');
    else setErrors({ global: res.error || 'Erreur lors de la création du compte. Réessaie.' });
  };

  const f = (field) => ({ value: form[field], onChange: e => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: undefined })); } });

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at top, #1a2035 0%, #0D0F14 60%)' }}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-4xl">⚡</span>
            <span className="font-display font-bold text-3xl">
              <span className="text-gradient-yellow">Poké</span><span className="text-white">lo</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold">Rejoindre la compétition</h1>
          <p className="text-gray-400 mt-1">Créez votre compte Pokélo gratuitement</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.global && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{errors.global}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Pseudo <span className="text-yellow-500">*</span></label>
              <input {...f('username')} type="text" className="input" placeholder="AshKetchum" required />
              {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email <span className="text-yellow-500">*</span></label>
              <input {...f('email')} type="email" className="input" placeholder="ash@pokelo.gg" required />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Région</label>
              <select {...f('region')} className="input">
                {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe <span className="text-yellow-500">*</span></label>
              <input {...f('password')} type="password" className="input" placeholder="Minimum 8 caractères" required />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmer <span className="text-yellow-500">*</span></label>
              <input {...f('confirm')} type="password" className="input" placeholder="••••••••" required />
              {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="neon-line mt-5 mb-4" />
          <p className="text-center text-sm text-gray-400">
            Déjà un compte ? <Link to="/login" className="text-yellow-500 hover:text-yellow-400 font-medium">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
