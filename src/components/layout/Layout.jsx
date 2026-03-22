import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', background: '#050d1a' }}>
      <Navbar />
      <main className="pt-14" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <Outlet />
      </main>
    </div>
  );
}
