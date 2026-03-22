export default function Avatar({ src, username = '?', size = 40, className = '' }) {
  const initials = username.slice(0, 2).toUpperCase();
  const colors = ['#2A75BB', '#FFCB05', '#9C27B0', '#4CAF50', '#F44336', '#FF9800'];
  const color = colors[username.charCodeAt(0) % colors.length];

  if (src) {
    return (
      <img
        src={src}
        alt={username}
        width={size}
        height={size}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onError={e => { e.target.style.display = 'none'; }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-dark flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}
