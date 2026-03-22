export default function StatCard({ label, value, sub, icon, color = 'yellow', className = '' }) {
  const colors = {
    yellow: 'text-yellow-500',
    blue:   'text-blue-400',
    green:  'text-green-400',
    red:    'text-red-400',
    purple: 'text-purple-400',
  };
  return (
    <div className={`card p-5 flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-400 text-sm">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold font-display ${colors[color] || colors.yellow}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}
