import { useState, useEffect, useRef } from 'react';
import Avatar from '../ui/Avatar';

const COLORS = {
  team1: { border: '#FFCB05', glow: 'rgba(255,203,5,0.35)', bg: 'rgba(255,203,5,0.07)', text: '#FFCB05' },
  team2: { border: '#3b82f6', glow: 'rgba(59,130,246,0.35)', bg: 'rgba(59,130,246,0.07)', text: '#60a5fa' },
};

function PlayerCard({ state, player, teamKey, revealDelay, is5v5 }) {
  const [flipped, setFlipped] = useState(false);
  const prevState = useRef(state);
  const [popped, setPopped] = useState(false);
  const c = COLORS[teamKey];

  const cardW = is5v5 ? 64 : 80;
  const cardH = is5v5 ? 92 : 115;
  const avatarSize = is5v5 ? 30 : 38;
  const nameFontSize = is5v5 ? 9 : 11;
  const eloFontSize = is5v5 ? 9 : 10;

  // Pop animation when slot fills
  useEffect(() => {
    if (prevState.current === 'empty' && state === 'filled') {
      setPopped(true);
      const t = setTimeout(() => setPopped(false), 500);
      return () => clearTimeout(t);
    }
    prevState.current = state;
  }, [state]);

  // Flip reveal
  useEffect(() => {
    if (state === 'revealing') {
      const t = setTimeout(() => setFlipped(true), revealDelay);
      return () => clearTimeout(t);
    } else {
      setFlipped(false);
    }
  }, [state, revealDelay]);

  const isEmpty = state === 'empty';

  return (
    <div style={{ width: cardW, height: cardH, perspective: '700px', flexShrink: 0 }}>
      <div style={{
        width: '100%', height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.65s cubic-bezier(0.4,0,0.2,1)',
        transform: flipped ? 'rotateY(180deg)' : popped ? 'scale(1.08)' : 'scale(1)',
      }}>

        {/* ── Face avant (anonyme) ── */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          borderRadius: 10,
          transition: 'border 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
          border: isEmpty ? '1.5px dashed rgba(255,255,255,0.1)' : `1.5px solid ${c.border}`,
          background: isEmpty ? 'rgba(5,13,26,0.6)' : `linear-gradient(180deg, ${c.bg} 0%, rgba(5,13,26,0.9) 100%)`,
          boxShadow: isEmpty ? 'none' : `0 0 18px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6,
        }}>
          {isEmpty ? (
            <div style={{
              width: is5v5 ? 26 : 32, height: is5v5 ? 26 : 32,
              borderRadius: '50%',
              border: '1.5px dashed rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse 2.5s ease-in-out infinite',
            }}>
              <span style={{ fontSize: is5v5 ? 12 : 14, color: 'rgba(255,255,255,0.15)', fontWeight: 700 }}>?</span>
            </div>
          ) : (
            <>
              <div style={{
                width: is5v5 ? 30 : 36, height: is5v5 ? 30 : 36,
                borderRadius: '50%',
                background: c.glow,
                border: `1.5px solid ${c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 10px ${c.glow}`,
              }}>
                <span style={{ fontSize: is5v5 ? 14 : 16 }}>⚡</span>
              </div>
              <div style={{ width: '60%', height: 1, background: `linear-gradient(90deg, transparent, ${c.border}, transparent)` }} />
              <div style={{ fontSize: is5v5 ? 8 : 9, color: c.text, fontFamily: 'Rajdhani', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                En file
              </div>
            </>
          )}
        </div>

        {/* ── Face arrière (révélée) ── */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 10,
          border: `1.5px solid ${c.border}`,
          background: `linear-gradient(180deg, ${c.bg} 0%, rgba(5,13,26,0.95) 100%)`,
          boxShadow: `0 0 22px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 4, padding: '6px 4px',
        }}>
          <Avatar src={player?.avatarUrl} username={player?.username} size={avatarSize} />
          <div style={{ width: '70%', height: 1, background: `linear-gradient(90deg, transparent, ${c.border}, transparent)` }} />
          <div style={{
            fontSize: nameFontSize, fontWeight: 700, color: '#fff',
            fontFamily: 'Rajdhani', textAlign: 'center',
            letterSpacing: '0.05em', lineHeight: 1.2,
            padding: '0 4px', wordBreak: 'break-all',
          }}>
            {player?.username || '???'}
          </div>
          <div style={{ fontSize: eloFontSize, color: c.text, fontWeight: 700, fontFamily: 'Rajdhani', letterSpacing: '0.1em' }}>
            {player?.elo} ELO
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LobbyPreview({ mode, queueSlots, matchFound }) {
  const teamSize = mode === 'TWO_V_TWO' ? 2 : 5;
  const totalSlots = teamSize * 2;
  const is5v5 = mode === 'FIVE_V_FIVE';
  const [revealPhase, setRevealPhase] = useState('none'); // none | all_filled | revealing

  useEffect(() => {
    if (matchFound) {
      setRevealPhase('all_filled');
      const t = setTimeout(() => setRevealPhase('revealing'), 700);
      return () => clearTimeout(t);
    } else {
      setRevealPhase('none');
    }
  }, [matchFound]);

  const getCardState = (index) => {
    if (revealPhase === 'revealing') return 'revealing';
    if (revealPhase === 'all_filled') return 'filled';
    return index < queueSlots ? 'filled' : 'empty';
  };

  const getPlayer = (index) => {
    if (!matchFound) return null;
    const t1 = matchFound.team1 || [];
    const t2 = matchFound.team2 || [];
    return index < teamSize ? t1[index] : t2[index - teamSize];
  };

  const team1 = Array.from({ length: teamSize }, (_, i) => i);
  const team2 = Array.from({ length: teamSize }, (_, i) => teamSize + i);

  return (
    <div style={{ width: '100%' }}>
      {/* Compteur / Status */}
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        {revealPhase !== 'none' ? (
          <div style={{
            fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13,
            color: '#4ade80', letterSpacing: '0.2em', textTransform: 'uppercase',
            textShadow: '0 0 12px rgba(74,222,128,0.5)',
            animation: 'queueFadeIn 0.4s ease-out',
          }}>
            ✓ Lobby complet — Révélation...
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {Array.from({ length: totalSlots }).map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                transition: 'background 0.3s ease, box-shadow 0.3s ease',
                background: i < queueSlots
                  ? (i < teamSize ? COLORS.team1.border : COLORS.team2.border)
                  : 'rgba(255,255,255,0.1)',
                boxShadow: i < queueSlots
                  ? `0 0 6px ${i < teamSize ? COLORS.team1.glow : COLORS.team2.glow}`
                  : 'none',
              }} />
            ))}
            <span style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginLeft: 4 }}>
              {queueSlots}/{totalSlots}
            </span>
          </div>
        )}
      </div>

      {/* Cartes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: is5v5 ? 6 : 10, flexWrap: 'wrap' }}>
        {/* Équipe 1 */}
        <div style={{ display: 'flex', gap: is5v5 ? 5 : 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {team1.map(i => (
            <PlayerCard key={i} state={getCardState(i)} player={getPlayer(i)}
              teamKey="team1" revealDelay={i * 200} is5v5={is5v5} />
          ))}
        </div>

        {/* VS */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 4px' }}>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 14, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>VS</span>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Équipe 2 */}
        <div style={{ display: 'flex', gap: is5v5 ? 5 : 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {team2.map(i => (
            <PlayerCard key={i} state={getCardState(i)} player={getPlayer(i)}
              teamKey="team2" revealDelay={(i - teamSize) * 200} is5v5={is5v5} />
          ))}
        </div>
      </div>
    </div>
  );
}
