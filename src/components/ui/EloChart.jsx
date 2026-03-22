import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="card px-3 py-2 text-sm">
        <p className="text-gray-400">{label}</p>
        <p className="font-bold text-yellow-500">{payload[0].value} Elo</p>
        <p className={`text-xs ${payload[0].payload.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {payload[0].payload.change >= 0 ? '+' : ''}{payload[0].payload.change}
        </p>
      </div>
    );
  }
  return null;
};

export default function EloChart({ history, mode }) {
  if (!history?.length) return (
    <div className="flex items-center justify-center h-32 text-gray-500 text-sm">Aucun historique disponible</div>
  );

  const data = [...history]
    .reverse()
    .slice(-20)
    .map(h => ({
      date: format(new Date(h.createdAt), 'dd/MM', { locale: fr }),
      elo: h.eloAfter,
      change: h.change,
    }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2E3446" />
        <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} />
        <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="elo"
          stroke="#FFCB05"
          strokeWidth={2}
          dot={{ fill: '#FFCB05', r: 3 }}
          activeDot={{ r: 5, fill: '#FFCB05', stroke: '#0D0F14', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
