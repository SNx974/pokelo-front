import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ActiveMatchBanner from './ActiveMatchBanner';
import MatchAcceptOverlay from '../match/MatchAcceptOverlay';
import { useAuthStore } from '../../store/authStore';

export default function Layout() {
  const { user } = useAuthStore();
  return (
    <div style={{ minHeight: '100vh', background: '#050d1a' }}>
      <Navbar />
      <main className="pt-14" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <Outlet />
      </main>
      <ActiveMatchBanner />
      {user && <MatchAcceptOverlay />}
    </div>
  );
}
