import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usersApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';

// Redimensionne et compresse l'image côté client (max 400x400, JPEG 80%)
function resizeImage(file, maxSize = 400, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(new File([blob], 'avatar.jpg', { type: 'image/jpeg' })), 'image/jpeg', quality);
    };
    img.src = url;
  });
}

const REGIONS = ['EU', 'NA', 'ASIA', 'OCE', 'SA', 'MENA'];
const ROLES   = ['Attaque', 'Défense', 'Support', 'Flex'];

// 151 Pokémon de la Gen 1
const POKEMON_LIST = [
  'Bulbizarre','Herbizarre','Florizarre','Salamèche','Reptincel','Dracaufeu',
  'Carapuce','Carabaffe','Tortank','Chenipan','Chrysacier','Papilusion',
  'Aspicot','Coconfort','Dardargnan','Ronflex','Corboss','Doduo',
  'Dodrio','Okéoké','Ossatueur','Noadkoko','Excelangue','Kangourex',
  'Hypnomade','Morpheo','Soporifik','Fantominus','Spectrum','Ectoplasma',
  'Onix','Miaouss','Persian','Psykokwak','Akwakwak','Ferosinge','Colossinge',
  'Caninos','Arcanin','Ptitard','Têtarte','Tartard','Abra','Kadabra','Alakazam',
  'Machoc','Machopeur','Mackogneur','Chetiflor','Boustiflor','Empiflor',
  'Tentacool','Tentacruel','Racaillou','Gravalanch','Grolem','Ponyta',
  'Galopa','Ramoloss','Flagadoss','Magneti','Magneton','Canarticho',
  'Doduo','Dodrio','Otaria','Lamantine','Osselait','Ossatueur',
  'Hypotrempe','Hypocéan','Votorba','Electrode','Noeunoeuf','Excelangue',
  'Tygnon','Leuphorie','Rhinocorne','Rhinoferos','Kangourex','Hypotrempe',
  'Poissirène','Poissoroy','Stari','Staross','M. Mime','Insécateur',
  'Lippoutou','Électabuzz','Magmar','Scarabrute','Tauros','Magicarpe',
  'Léviator','Lokhlass','Porygon','Amonita','Amonistar','Kabuto',
  'Kabutops','Ptéra','Ronflex','Artikodin','Électhor','Sulfura',
  'Minidraco','Draco','Dracolosse','Mewtwo','Mew',
];

export default function ProfileEdit() {
  const { id } = useParams();
  const { user: me, setUser } = useAuthStore();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [form, setForm] = useState({
    username: '',
    region: 'EU',
    preferredRole: '',
    bio: '',
    favoritePokemon: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pokemonSearch, setPokemonSearch] = useState('');
  const [showPokemonDropdown, setShowPokemonDropdown] = useState(false);

  // Redirect if not own profile
  useEffect(() => {
    if (me && me.id !== id) navigate(`/profile/${id}`, { replace: true });
  }, [me, id, navigate]);

  // Load current profile data
  useEffect(() => {
    usersApi.getProfile(id).then(res => {
      const p = res.data;
      setForm({
        username: p.username || '',
        region: p.region || 'EU',
        preferredRole: p.preferredRole || '',
        bio: p.bio || '',
        favoritePokemon: p.favoritePokemon || '',
      });
      setPokemonSearch(p.favoritePokemon || '');
    }).catch(console.error);
  }, [id]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const filteredPokemon = POKEMON_LIST.filter(p =>
    p.toLowerCase().includes(pokemonSearch.toLowerCase())
  ).slice(0, 8);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Upload avatar first if changed (compress before sending)
      if (avatarFile) {
        const compressed = await resizeImage(avatarFile);
        const res = await usersApi.uploadAvatar(compressed);
        if (setUser) setUser({ ...me, avatarUrl: res.data.avatarUrl });
      }

      // Update profile fields
      const res = await usersApi.updateProfile({
        username:        form.username,
        region:          form.region,
        preferredRole:   form.preferredRole || null,
        bio:             form.bio,
        favoritePokemon: form.favoritePokemon,
      });

      if (setUser) setUser({ ...me, ...res.data });
      toast.success('Profil mis à jour !');
      navigate(`/profile/${id}`);
    } catch (err) {
      // error toast handled by api interceptor
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/profile/${id}`} className="text-gray-400 hover:text-white transition-colors text-sm">← Retour</Link>
        <h1 className="font-bold text-2xl">Modifier le profil</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="card p-6">
          <h2 className="font-bold mb-4 text-yellow-500 uppercase tracking-wider text-xs">Photo de profil</h2>
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
              <div className="rounded-full overflow-hidden" style={{ width: 80, height: 80, border: '2px solid rgba(255,203,5,0.3)' }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                  : <Avatar src={me?.avatarUrl} username={me?.username} size={80} />
                }
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-xs text-white font-semibold">Changer</span>
              </div>
            </div>
            <div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="btn-ghost text-sm px-4 py-2">
                📷 Choisir une image
              </button>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP — max 5 Mo</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
          </div>
        </div>

        {/* Infos */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold mb-2 text-yellow-500 uppercase tracking-wider text-xs">Informations</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Pseudo</label>
            <input className="input" value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="Ton pseudo" maxLength={20} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Région</label>
              <select className="input" value={form.region}
                onChange={e => setForm(f => ({ ...f, region: e.target.value }))}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Rôle préféré</label>
              <select className="input" value={form.preferredRole}
                onChange={e => setForm(f => ({ ...f, preferredRole: e.target.value }))}>
                <option value="">— Aucun —</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea className="input resize-none" rows={3}
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Présente-toi en quelques mots..." maxLength={200} />
            <p className="text-xs text-gray-600 mt-0.5 text-right">{form.bio.length}/200</p>
          </div>
        </div>

        {/* Pokémon favori */}
        <div className="card p-6" style={{ overflow: 'visible' }}>
          <h2 className="font-bold mb-4 text-yellow-500 uppercase tracking-wider text-xs">Pokémon Favori</h2>
          <div className="relative">
            <input
              className="input"
              placeholder="Recherche un Pokémon..."
              value={pokemonSearch}
              onChange={e => {
                setPokemonSearch(e.target.value);
                setShowPokemonDropdown(true);
                if (!e.target.value) setForm(f => ({ ...f, favoritePokemon: '' }));
              }}
              onFocus={() => setShowPokemonDropdown(true)}
            />
            {form.favoritePokemon && (
              <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <img
                  src={`https://img.pokemondb.net/sprites/sword-shield/icon/${form.favoritePokemon.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'')}.png`}
                  alt={form.favoritePokemon}
                  className="w-8 h-8 object-contain"
                  onError={e => { e.target.style.display='none'; }}
                />
                <span className="text-sm font-semibold text-yellow-400">{form.favoritePokemon}</span>
                <button type="button" className="ml-auto text-gray-500 hover:text-red-400 text-xs"
                  onClick={() => { setForm(f => ({ ...f, favoritePokemon: '' })); setPokemonSearch(''); }}>
                  ✕
                </button>
              </div>
            )}
            {showPokemonDropdown && pokemonSearch && filteredPokemon.length > 0 && (
              <div className="absolute z-20 w-full mt-1 rounded-lg border border-white/10 overflow-hidden"
                style={{ background: '#0a1628' }}>
                {filteredPokemon.map(p => (
                  <button key={p} type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 text-left transition-colors"
                    onClick={() => {
                      setForm(f => ({ ...f, favoritePokemon: p }));
                      setPokemonSearch(p);
                      setShowPokemonDropdown(false);
                    }}>
                    <img
                      src={`https://img.pokemondb.net/sprites/sword-shield/icon/${p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'')}.png`}
                      alt={p} className="w-6 h-6 object-contain"
                      onError={e => { e.target.style.display='none'; }}
                    />
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link to={`/profile/${id}`} className="btn-ghost px-5 py-2.5 text-sm">Annuler</Link>
          <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm">
            {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      </form>
    </div>
  );
}
