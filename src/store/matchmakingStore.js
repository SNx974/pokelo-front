import { create } from 'zustand';
import { matchmakingApi } from '../services/api';
import { onWS } from '../services/websocket';
import toast from 'react-hot-toast';

export const useMatchmakingStore = create((set, get) => ({
  inQueue: false,
  queueEntry: null,
  waitTime: 0,
  matchFound: null,
  queueInfo: { TWO_V_TWO: { SOLO: 0, TEAM: 0 }, FIVE_V_FIVE: { SOLO: 0, TEAM: 0 } },
  timer: null,

  joinQueue: async (mode, queueType, teamId = null) => {
    try {
      const { data } = await matchmakingApi.join({ mode, queueType, teamId });
      const timer = setInterval(() => set(s => ({ waitTime: s.waitTime + 1 })), 1000);
      set({ inQueue: true, queueEntry: data, waitTime: 0, timer });

      // Listen for match found via WS
      onWS('MATCH_FOUND', (matchData) => {
        get().onMatchFound(matchData);
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error };
    }
  },

  leaveQueue: async () => {
    try {
      await matchmakingApi.leave();
      const { timer } = get();
      if (timer) clearInterval(timer);
      set({ inQueue: false, queueEntry: null, waitTime: 0, timer: null });
      toast.success('File d\'attente quittée');
    } catch {}
  },

  onMatchFound: (matchData) => {
    const { timer } = get();
    if (timer) clearInterval(timer);
    set({ inQueue: false, matchFound: matchData, timer: null });
  },

  fetchQueueInfo: async () => {
    try {
      const { data } = await matchmakingApi.info();
      set({ queueInfo: data });
    } catch {}
  },

  checkStatus: async () => {
    try {
      const { data } = await matchmakingApi.status();
      if (data.inQueue && !get().inQueue) {
        set({ inQueue: true, queueEntry: data.entry });
      }
    } catch {}
  },

  reset: () => {
    const { timer } = get();
    if (timer) clearInterval(timer);
    set({ inQueue: false, queueEntry: null, waitTime: 0, matchFound: null, timer: null });
  },
}));
