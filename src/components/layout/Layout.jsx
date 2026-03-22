import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>
      <footer className="border-t border-dark-300 py-8 text-center text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">⚡</span>
            <span className="font-display font-bold text-white">Pokélo</span>
          </div>
          <p>Plateforme compétitive Pokémon — Saison 1 • {new Date().getFullYear()}</p>
          <p className="mt-1 text-xs text-dark-400">Pokémon est une marque déposée de Nintendo / Game Freak</p>
        </div>
      </footer>
    </div>
  );
}
