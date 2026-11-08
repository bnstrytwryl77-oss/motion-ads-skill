import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, theme} from '../theme';

export type IconName = 'island' | 'cannon' | 'swords' | 'calendar' | 'bag' | 'trophy' | 'star' | 'hourglass' | 'stopwatch';

const G = theme.gold;
const R = theme.red;
const C = theme.ocean;

const paths: Record<IconName, (f: number) => React.ReactNode> = {
  island: (f) => (
    <>
      <ellipse cx={50} cy={74} rx={38} ry={10} fill="#E9C46A" />
      <path d="M50 72 C48 55 52 45 50 30" stroke="#8B5A2B" strokeWidth={5} fill="none" strokeLinecap="round" />
      <g transform={`rotate(${Math.sin(f / 12) * 4} 50 30)`}>
        <path d="M50 30 C40 22 28 24 22 32 C32 28 42 29 50 30Z" fill="#2A9D8F" />
        <path d="M50 30 C60 22 72 24 78 32 C68 28 58 29 50 30Z" fill="#2A9D8F" />
        <path d="M50 30 C46 18 52 10 60 8 C55 16 53 22 50 30Z" fill="#40C9A2" />
      </g>
      {[0, 1].map((i) => (
        <path key={i} d={`M${8 + ((f * 0.6 + i * 30) % 30)} ${86 + i * 6} q6 -4 12 0 t12 0 t12 0 t12 0 t12 0`} stroke={C} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.8} />
      ))}
    </>
  ),
  cannon: (f) => {
    const kick = Math.max(0, Math.sin(f / 9)) ** 8 * 4;
    return (
      <>
        {[0, 1, 2].map((i) => {
          const t = ((f + i * 12) % 36) / 36;
          return <circle key={i} cx={74 + t * 18} cy={30 - t * 16} r={4 + t * 9} fill="#DDD" opacity={(1 - t) * 0.7} />;
        })}
        <g transform={`translate(${-kick} 0) rotate(-28 46 56)`}>
          <rect x={22} y={46} width={56} height={20} rx={9} fill="#3A3A4A" />
          <rect x={72} y={44} width={8} height={24} rx={3} fill="#555" />
        </g>
        <circle cx={40} cy={70} r={14} fill="none" stroke="#8B5A2B" strokeWidth={6} />
        <circle cx={40} cy={70} r={3} fill="#8B5A2B" />
      </>
    );
  },
  swords: (f) => {
    const a = Math.sin(f / 15) * 3;
    const sword = (rot: number, col: string) => (
      <g transform={`rotate(${rot + a} 50 52)`}>
        <path d="M47 6 L53 6 L53 62 L50 68 L47 62Z" fill="#E6EEF5" />
        <rect x={34} y={62} width={32} height={7} rx={3} fill={col} />
        <rect x={46.5} y={69} width={7} height={20} rx={2} fill="#2B2B35" />
        <circle cx={50} cy={92} r={4} fill={col} />
      </g>
    );
    return (
      <>
        {sword(-40, G)}
        {sword(40, R)}
      </>
    );
  },
  calendar: () => (
    <>
      <rect x={14} y={20} width={72} height={66} rx={10} fill="#F4F4F8" />
      <rect x={14} y={20} width={72} height={18} rx={10} fill={R} />
      <rect x={14} y={30} width={72} height={8} fill={R} />
      {[0, 1, 2, 3].map((c) => [0, 1, 2].map((r) => <rect key={`${c}${r}`} x={22 + c * 16} y={46 + r * 13} width={10} height={8} rx={2} fill={c === 2 && r === 1 ? G : '#C9C9D6'} />))}
      <rect x={28} y={12} width={6} height={16} rx={3} fill="#555" />
      <rect x={66} y={12} width={6} height={16} rx={3} fill="#555" />
    </>
  ),
  bag: (f) => (
    <>
      <path d="M36 34 C36 16 64 16 64 34" stroke={G} strokeWidth={6} fill="none" />
      <rect x={20} y={32} width={60} height={56} rx={10} fill="#7B5CFF" />
      <path d={`M50 ${50 + Math.sin(f / 10) * 2} l4 9 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 -1z`} fill={G} />
    </>
  ),
  trophy: () => (
    <>
      <path d="M30 16 H70 V40 C70 56 60 64 50 64 C40 64 30 56 30 40Z" fill={G} />
      <path d="M30 22 H18 C18 38 26 44 32 44" stroke={G} strokeWidth={5} fill="none" />
      <path d="M70 22 H82 C82 38 74 44 68 44" stroke={G} strokeWidth={5} fill="none" />
      <rect x={45} y={62} width={10} height={14} fill="#C47F0C" />
      <rect x={32} y={76} width={36} height={10} rx={3} fill="#8B5A2B" />
      <path d="M40 22 L44 22 L42 50Z" fill="#FFF3C4" opacity={0.7} />
    </>
  ),
  star: (f) => (
    <g transform={`rotate(${f * 0.8} 50 50)`}>
      {new Array(12).fill(0).map((_, i) => (
        <rect key={i} x={48} y={6} width={4} height={14} rx={2} fill={i % 2 ? G : R} transform={`rotate(${i * 30} 50 50)`} />
      ))}
      <path d="M50 24 L57 42 L76 43 L61 55 L66 74 L50 63 L34 74 L39 55 L24 43 L43 42Z" fill={G} />
    </g>
  ),
  hourglass: (f) => {
    const t = (f % 90) / 90;
    return (
      <>
        <rect x={24} y={10} width={52} height={8} rx={3} fill="#8B5A2B" />
        <rect x={24} y={82} width={52} height={8} rx={3} fill="#8B5A2B" />
        <path d="M30 18 H70 C70 38 54 44 54 50 C54 56 70 62 70 82 H30 C30 62 46 56 46 50 C46 44 30 38 30 18Z" fill="rgba(255,255,255,0.15)" stroke="#E6EEF5" strokeWidth={3} />
        <path d={`M${34 + t * 12} ${22 + t * 20} H${66 - t * 12} L50 48Z`} fill={G} />
        <path d={`M50 52 L${34 + (1 - t) * 14} 80 H${66 - (1 - t) * 14}Z`} fill={G} />
        <rect x={49} y={48} width={2} height={30} fill={G} opacity={0.8} />
      </>
    );
  },
  stopwatch: (f) => (
    <>
      <rect x={44} y={6} width={12} height={8} rx={2} fill="#AAA" />
      <circle cx={50} cy={54} r={36} fill="#F4F4F8" />
      <circle cx={50} cy={54} r={36} fill="none" stroke={R} strokeWidth={6} strokeDasharray={`${(f % 60) / 60 * 226} 226`} transform="rotate(-90 50 54)" />
      <line x1={50} y1={54} x2={50 + Math.sin(f / 9.5) * 26} y2={54 - Math.cos(f / 9.5) * 26} stroke="#222" strokeWidth={4} strokeLinecap="round" />
      <circle cx={50} cy={54} r={4} fill="#222" />
    </>
  ),
};

export const Icon: React.FC<{name: IconName; size: number; delay?: number}> = ({name, size, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 11, stiffness: 120}});
  const float = Math.sin(frame / 20) * 8;
  const glow = interpolate(frame - delay, [0, 20], [0, 1], clamp);
  return (
    <div style={{width: size, height: size, position: 'relative', transform: `translateY(${float}px) scale(${s}) rotate(${(1 - s) * -25}deg)`}}>
      <div style={{position: 'absolute', inset: '10%', borderRadius: '50%', background: theme.gold, filter: `blur(${size * 0.25}px)`, opacity: 0.25 * glow}} />
      <svg viewBox="0 0 100 100" width={size} height={size} style={{position: 'relative', filter: 'drop-shadow(0 18px 24px rgba(0,0,0,0.5))'}}>
        {paths[name](frame)}
      </svg>
    </div>
  );
};
