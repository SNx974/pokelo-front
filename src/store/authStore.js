import { create } from 'zustand';
import { authApi } from '../services/api';
import { connectWS, disconnectWS } from '../services/websocket';
import { useNotificationStore } from './notificationStore';
import toast from 'react-hot-toast';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initializing: true,
  wsConnected: false,

  initAuth: async () => {
    const token = localStorage.getItem('pokelo_token');
    if (!token) { set({ initializing: false }); return; }
    try {
      const { data } = await authApi.me();
      set({ user: data, token, initializing: false });
      connectWS(token, (msg) => get().handleWSMessage(msg));
    } catch {
      localStorage.removeItem('pokelo_token');
      set({ user: null, token: null, initializing: false });
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
    const notif = useNotificationStore.getState().push;
    switch (msg.type) {
      case 'AUTH_OK':
        set({ wsConnected: true });
        break;

      case 'MATCH_FOUND':
        toast.success('🎮 Match trouvé ! Acceptez dans 30s.', { duration: 6000 });
        notif({ type: 'MATCH_FOUND', message: `Match trouvé ! Acceptez maintenant.`, matchId: msg.data?.matchId });
        break;

      case 'MATCH_STARTED':
        toast.success('⚔️ Le match commence !', { duration: 4000 });
        notif({ type: 'MATCH_STARTED', message: 'Votre match a commencé !', matchId: msg.data?.matchId });
        break;

      case 'MATCH_CANCELLED':
        toast.error(`Match annulé — ${msg.data?.reason || 'un joueur a refusé'}`, { duration: 5000 });
        notif({ type: 'MATCH_CANCELLED', message: `Match annulé: ${msg.data?.reason || 'un joueur a refusé'}` });
        break;

      case 'REQUEUED':
        toast('🔄 Réintégré dans la file d\'attente.', { icon: '🔄', duration: 4000 });
        notif({ type: 'REQUEUED', message: 'Vous avez été réintégré dans la file d\'attente.' });
        break;

      case 'MATCH_RESULT':
        if (msg.data.isWinner) {
          toast.success(`🏆 Victoire ! ${msg.data.eloChange >= 0 ? '+' : ''}${msg.data.eloChange} Elo`, { duration: 6000 });
          notif({ type: 'MATCH_RESULT', message: `Victoire ! ${msg.data.eloChange >= 0 ? '+' : ''}${msg.data.eloChange} Elo`, matchId: msg.data?.matchId });
        } else {
          toast.error(`Défaite. ${msg.data.eloChange} Elo`, { duration: 6000 });
          notif({ type: 'MATCH_RESULT', message: `Défaite. ${msg.data.eloChange} Elo`, matchId: msg.data?.matchId });
        }
        break;

      case 'SCORE_SUBMITTED':
        toast('⚔️ L\'autre équipe a soumis son score.', { icon: '📋', duration: 4000 });
        notif({ type: 'SCORE_SUBMITTED', message: 'L\'autre équipe a soumis son score.', matchId: msg.data?.matchId });
        break;

      case 'MATCH_DISPUTED':
        toast.error('⚠️ Litige créé — scores divergents.', { duration: 6000 });
        notif({ type: 'MATCH_DISPUTED', message: 'Litige créé — scores divergents.', matchId: msg.data?.matchId });
        break;

      case 'TEAM_INVITATION':
        toast('📬 Invitation d\'équipe reçue de ' + msg.data?.teamName, { icon: '🛡️', duration: 6000 });
        notif({
          type: 'TEAM_INVITATION',
          message: `Invitation de l'équipe "${msg.data?.teamName}"`,
          invitationId: msg.data?.invitationId,
        });
        break;

      case 'TEAM_INVITE_ACCEPTED':
        toast.success(`✅ ${msg.data?.username} a rejoint votre équipe !`, { duration: 5000 });
        notif({ type: 'TEAM_INVITE_ACCEPTED', message: `${msg.data?.username} a rejoint votre équipe !` });
        break;

      case 'TEAM_KICKED':
        toast.error(`Vous avez été retiré de ${msg.data?.teamName}`, { duration: 5000 });
        notif({ type: 'TEAM_KICKED', message: `Vous avez été retiré de l'équipe "${msg.data?.teamName}"` });
        break;

      case 'TEAM_DISSOLVED':
        toast.error(`L'équipe ${msg.data?.teamName} a été dissoute.`, { duration: 5000 });
        notif({ type: 'TEAM_DISSOLVED', message: `L'équipe "${msg.data?.teamName}" a été dissoute.` });
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
