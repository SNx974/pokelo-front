import { create } from 'zustand';
import { teamsApi } from '../services/api';

const MAX_NOTIFICATIONS = 50;

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  // Ajoute une notification
  push: (notification) => {
    const notif = {
      id: Date.now() + Math.random(),
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    };
    set(state => ({
      notifications: [notif, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
      unreadCount: state.unreadCount + 1,
    }));
    return notif;
  },

  // Marque toutes comme lues
  markAllRead: () => set({ unreadCount: 0, notifications: get().notifications.map(n => ({ ...n, read: true })) }),

  // Retire une notification
  remove: (id) => set(state => ({
    notifications: state.notifications.filter(n => n.id !== id),
    unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id && !n.read) ? 1 : 0)),
  })),

  // Accepte une invitation depuis le centre de notif
  acceptInvitation: async (invitationId, notifId) => {
    try {
      await teamsApi.acceptInvitation(invitationId);
      // Retire la notif
      get().remove(notifId);
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  // Refuse une invitation depuis le centre de notif
  declineInvitation: async (invitationId, notifId) => {
    try {
      await teamsApi.declineInvitation(invitationId);
      get().remove(notifId);
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  clear: () => set({ notifications: [], unreadCount: 0 }),
}));
