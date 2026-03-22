import { create } from 'zustand';
import { authApi } from '../services/api';
import { connectWS, disconnectWS } from '../services/websocket';
import toast from 'react-hot-toast';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: false,
  wsConnected: false,

  initAuth: async () => {
    const token = localStorage.getItem('pokelo_token');
    if (!token) return;
    try {
      const { data } = await authApi.me();
      set({ user: data, token });
      connectWS(token, (msg) => get().handleWSMessage(msg));
    } catch {
      localStorage.removeItem('pokelo_token');
      set({ user: null, token: null });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem('pokelo_token', data.token);
      set({ user: data.user, token: data.token, loading: false });
      connectWS(data.token, (msg) => get().handleWSMessage(msg));
      toast.success(`Bienvenue, ${data.user.username} !`);
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false, error: err.response?.data?.error };
    }
  },

  register: async (formData) => {
    set({ loading: true });
    try {
      const { data } = await authApi.register(formData);
      localStorage.setItem('pokelo_token', data.token);
      set({ user: data.user, token: data.token, loading: false });
      connectWS(data.token, (msg) => get().handleWSMessage(msg));
      toast.success(`Compte créé ! Bienvenue, ${data.user.username} !`);
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false, error: err.response?.data?.error };
    }
  },

  logout: () => {
    localStorage.removeItem('pokelo_token');
    disconnectWS();
    set({ user: null, token: null, wsConnected: false });
    toast.success('Déconnecté');
  },

  updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),

  handleWSMessage: (msg) => {
    switch (msg.type) {
      case 'AUTH_OK':
        set({ wsConnected: true });
        break;
      case 'MATCH_FOUND':
        toast.success('🎮 Match trouvé ! Redirection...', { duration: 5000 });
        setTimeout(() => { window.location.href = `/match/${msg.data.matchId}`; }, 2000);
        break;
      case 'MATCH_RESULT':
        if (msg.data.isWinner) {
          toast.success(`🏆 Victoire ! ${msg.data.eloChange >= 0 ? '+' : ''}${msg.data.eloChange} Elo`, { duration: 6000 });
        } else {
          toast.error(`Défaite. ${msg.data.eloChange} Elo`, { duration: 6000 });
        }
        break;
      case 'SCORE_SUBMITTED':
        toast('⚔️ L\'autre équipe a soumis son score.', { icon: '📋', duration: 4000 });
        break;
      case 'MATCH_DISPUTED':
        toast.error('⚠️ Litige créé — scores divergents.', { duration: 6000 });
        break;
      case 'TEAM_INVITATION':
        toast('🛡️ Invitation d\'équipe reçue de ' + msg.data?.teamName, { icon: '📬', duration: 6000 });
        break;
      case 'TEAM_INVITE_ACCEPTED':
        toast.success(`✅ ${msg.data?.username} a rejoint votre équipe !`, { duration: 5000 });
        break;
      case 'TEAM_KICKED':
        toast.error(`Vous avez été retiré de ${msg.data?.teamName}`, { duration: 5000 });
        break;
      case 'TEAM_DISSOLVED':
        toast.error(`L'équipe ${msg.data?.teamName} a été dissoute.`, { duration: 5000 });
        break;
      case 'ACCOUNT_BANNED':
        toast.error(`Compte suspendu: ${msg.reason}`);
        get().logout();
        break;
      default:
        break;
    }
  },
}));
