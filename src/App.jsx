import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import Ladder from './pages/Ladder';
import TeamPage from './pages/TeamPage';
import TeamManage from './pages/TeamManage';
import Matchmaking from './pages/Matchmaking';
import MatchPage from './pages/MatchPage';
import AdminPanel from './pages/AdminPanel';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (adminOnly && !['ADMIN', 'MODERATOR'].includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="ladder" element={<Ladder />} />
        <Route path="profile/:id" element={<Profile />} />
        <Route path="profile/:id/edit" element={
          <ProtectedRoute><ProfileEdit /></ProtectedRoute>
        } />
        <Route path="team/manage" element={
          <ProtectedRoute><TeamManage /></ProtectedRoute>
        } />
        <Route path="team/:id" element={<TeamPage />} />
        <Route path="match/:id" element={<MatchPage />} />
        <Route path="matchmaking" element={
          <ProtectedRoute><Matchmaking /></ProtectedRoute>
        } />
        <Route path="admin/*" element={
          <ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>
        } />
      </Route>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
