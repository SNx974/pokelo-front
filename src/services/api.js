import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Inject token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pokelo_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Erreur réseau';
    if (err.response?.status === 401) {
      localStorage.removeItem('pokelo_token');
      localStorage.removeItem('pokelo_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    // Only toast on 4xx client errors (not network/server errors)
    const status = err.response?.status;
    if (status && status >= 400 && status < 500 && status !== 401) {
      toast.error(msg);
    }
    return Promise.reject(err);
  },
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login',    data),
  me:       ()     => api.get('/auth/me'),
  refresh:  ()     => api.post('/auth/refresh'),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersApi = {
  search:       (params) => api.get('/users', { params }),
  getProfile:   (id)     => api.get(`/users/${id}`),
  getMatches:   (id, params) => api.get(`/users/${id}/matches`, { params }),
  getEloHistory:(id)     => api.get(`/users/${id}/elo-history`),
  updateProfile:(data)   => api.patch('/users/me/profile', data),
  uploadAvatar: (file)   => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ─── Teams ───────────────────────────────────────────────────────────────────
export const teamsApi = {
  list:             (params)           => api.get('/teams', { params }),
  get:              (id)               => api.get(`/teams/${id}`),
  create:           (data)             => api.post('/teams', data),
  update:           (id, data)         => api.patch(`/teams/${id}`, data),
  delete:           (id)               => api.delete(`/teams/${id}`),
  invite:           (id, targetUserId) => api.post(`/teams/${id}/invite`, { targetUserId }),
  kick:             (id, targetUserId) => api.post(`/teams/${id}/kick`, { targetUserId }),
  leave:            (id)               => api.post(`/teams/${id}/leave`),
  acceptInvitation: (invId)            => api.post(`/teams/invitations/${invId}/accept`),
  declineInvitation:(invId)            => api.post(`/teams/invitations/${invId}/decline`),
};

// ─── Matches ─────────────────────────────────────────────────────────────────
export const matchesApi = {
  list:         (params) => api.get('/matches', { params }),
  get:          (id)     => api.get(`/matches/${id}`),
  submitResult: (id, winnerTeam) => api.post(`/matches/${id}/result`, { winnerTeam }),
  createDispute:(id, desc)       => api.post(`/matches/${id}/dispute`, { description: desc }),
  report:       (id, data)       => api.post(`/matches/${id}/report`, data),
};

// ─── Matchmaking ─────────────────────────────────────────────────────────────
export const matchmakingApi = {
  join:   (data) => api.post('/matchmaking/join', data),
  leave:  ()     => api.post('/matchmaking/leave'),
  status: ()     => api.get('/matchmaking/status'),
  info:   ()     => api.get('/matchmaking/info'),
};

// ─── Ladder ──────────────────────────────────────────────────────────────────
export const ladderApi = {
  players: (params) => api.get('/ladder/players', { params }),
  teams:   (params) => api.get('/ladder/teams',   { params }),
  stats:   ()       => api.get('/ladder/stats'),
};

// ─── News ─────────────────────────────────────────────────────────────────────
export const newsApi = {
  list:   ()          => api.get('/news'),
  get:    (id)        => api.get(`/news/${id}`),
  create: (data)      => api.post('/news', data),
  update: (id, data)  => api.patch(`/news/${id}`, data),
  delete: (id)        => api.delete(`/news/${id}`),
};

// ─── Tournaments ─────────────────────────────────────────────────────────────
export const tournamentsApi = {
  list: () => api.get('/tournaments'),
  get:  (id) => api.get(`/tournaments/${id}`),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard:      ()           => api.get('/admin/dashboard'),
  listUsers:      (params)     => api.get('/admin/users', { params }),
  banUser:        (id, data)   => api.patch(`/admin/users/${id}/ban`, data),
  unbanUser:      (id)         => api.patch(`/admin/users/${id}/unban`),
  listDisputes:   (params)     => api.get('/admin/disputes', { params }),
  resolveDispute: (id, data)   => api.patch(`/admin/disputes/${id}`, data),
  listReports:    ()           => api.get('/admin/reports'),
  resolveReport:  (id)         => api.patch(`/admin/reports/${id}`),
  overrideMatch:  (id, winner) => api.post(`/admin/matches/${id}/override`, { winnerTeam: winner }),
};

export default api;
