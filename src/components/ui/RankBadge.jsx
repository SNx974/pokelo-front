const RANKS = {
  'Rookie':     { color: '#9E9E9E', bg: 'rgba(158,158,158,0.15)' },
  'Novice':     { color: '#4CAF50', bg: 'rgba(76,175,80,0.15)' },
  'Pokéfan':    { color: '#FFC107', bg: 'rgba(255,193,7,0.15)' },
  'Entraîneur': { color: '#FF9800', bg: 'rgba(255,152,0,0.15)' },
  'Expert':     { color: '#2196F3', bg: 'rgba(33,150,243,0.15)' },
  'Master':     { color: '#9C27B0', bg: 'rgba(156,39,176,0.15)' },
  'Champion':   { color: '#FFCB05', bg: 'rgba(255,203,5,0.15)' },
  'Grand Master':{ color: '#F44336', bg: 'rgba(244,67,54,0.15)' },
  'Légende':    { color: '#E91E63', bg: 'rgba(233,30,99,0.15)' },
};

export default function RankBadge({ rank, size = 'sm', showElo, elo }) {
  if (!rank) return null;
  const style = RANKS[rank.name] || { color: '#9E9E9E', bg: 'rgba(158,158,158,0.15)' };
  const isLarge = size === 'lg';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${isLarge ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs'}`}
      style={{ color: style.color, background: style.bg, border: `1px solid ${style.color}40` }}
    >
      <span>{rank.icon}</span>
      <span>{rank.name}</span>
      {showElo && <span className="opacity-70 ml-1">{elo}</span>}
    </span>
  );
}
