import React from 'react';
import {AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, theme} from '../theme';

const Skull: React.FC<{size: number}> = ({size}) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <g stroke="#7A4E05" strokeWidth={9} strokeLinecap="round">
      <line x1={22} y1={24} x2={78} y2={80} />
      <line x1={78} y1={24} x2={22} y2={80} />
    </g>
    {[[18, 20], [82, 20], [18, 84], [82, 84]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={7} fill="#7A4E05" />
    ))}
    <circle cx={50} cy={44} r={23} fill="#7A4E05" />
    <rect x={38} y={56} width={24} height={17} rx={5} fill="#7A4E05" />
    <circle cx={41} cy={45} r={6.5} fill={theme.gold} />
    <circle cx={59} cy={45} r={6.5} fill={theme.gold} />
    <path d="M50 52 L46 59 L54 59 Z" fill={theme.gold} />
    <g stroke={theme.gold} strokeWidth={2.5}>
      <line x1={45} y1={64} x2={45} y2={72} />
      <line x1={50} y1={64} x2={50} y2={72} />
      <line x1={55} y1={64} x2={55} y2={72} />
    </g>
  </svg>
);

const Face: React.FC<{size: number; z: number; back?: boolean}> = ({size, z, back}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      transform: `${back ? 'rotateY(180deg) ' : ''}translateZ(${z}px)`,
      backfaceVisibility: 'hidden',
      background: 'radial-gradient(circle at 35% 28%, #FFF6CF 0%, #FFD45A 32%, #E9A21C 70%, #A8680A 100%)',
      boxShadow: `inset 0 0 0 ${size * 0.045}px #D8961A, inset 0 0 0 ${size * 0.07}px #FFE48A, inset 0 0 ${size * 0.12}px rgba(120,70,0,0.6)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div style={{position: 'absolute', inset: size * 0.13, borderRadius: '50%', border: `${size * 0.012}px dashed rgba(122,78,5,0.6)`}} />
    <Skull size={size * 0.56} />
  </div>
);

// Real 3D coin: two faces + stacked discs for the edge thickness
export const Coin: React.FC<{size: number; rotY: number; rotX?: number}> = ({size, rotY, rotX = 0}) => {
  const T = size * 0.09;
  const layers = 14;
  return (
    <div style={{width: size, height: size, position: 'relative', transformStyle: 'preserve-3d', transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`}}>
      {new Array(layers).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: i % 2 ? '#B8780E' : '#9A6208',
            transform: `translateZ(${-T / 2 + (T * (i + 0.5)) / layers}px)`,
          }}
        />
      ))}
      <Face size={size} z={T / 2} />
      <Face size={size} z={T / 2} back />
    </div>
  );
};

export const Sparkle: React.FC<{x: number; y: number; size: number; delay: number}> = ({x, y, size, delay}) => {
  const frame = useCurrentFrame();
  const t = (frame - delay) % 40;
  const s = frame < delay ? 0 : interpolate(t, [0, 10, 24], [0, 1, 0], clamp);
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}
      style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(${t * 3}deg)`, filter: `drop-shadow(0 0 8px ${theme.gold})`}}>
      <path d="M12 0 L13.8 10.2 L24 12 L13.8 13.8 L12 24 L10.2 13.8 L0 12 L10.2 10.2Z" fill="#FFF3C4" />
    </svg>
  );
};

// Falling gold coins (flat, spinning) for depth
export const CoinRain: React.FC<{count?: number; seed?: string; opacity?: number}> = ({count = 16, seed = 'r', opacity = 1}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{opacity, pointerEvents: 'none'}}>
      {new Array(count).fill(0).map((_, i) => {
        const depth = 0.3 + random(`${seed}d${i}`) * 0.7;
        const size = 40 + depth * 90;
        const x = random(`${seed}x${i}`) * width;
        const startY = -200 - random(`${seed}y${i}`) * height;
        const y = startY + frame * (6 + depth * 10);
        const spin = Math.cos(frame * (0.08 + depth * 0.08) + i);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              transform: `scaleX(${Math.max(0.12, Math.abs(spin))}) rotate(${i * 30}deg)`,
              background: spin > 0 ? 'radial-gradient(circle at 35% 30%, #FFF2B8, #FFC83D 45%, #B9780C)' : '#B07410',
              boxShadow: `inset 0 0 0 ${size * 0.08}px #E3A72A`,
              filter: depth < 0.55 ? `blur(${(0.55 - depth) * 14}px)` : undefined,
              opacity: 0.5 + depth * 0.5,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const useSpin = (delay: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping: 200}, durationInFrames: 50});
};

// 3D coin whose faces are the player's screenshot (circular crop + gold rim)
export const ShotCoin: React.FC<{size: number; rotY: number; rotX?: number}> = ({size, rotY, rotX = 0}) => {
  const T = size * 0.08;
  const layers = 12;
  const face = (back: boolean) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        transform: `${back ? 'rotateY(180deg) ' : ''}translateZ(${T / 2}px)`,
        backfaceVisibility: 'hidden',
        background: '#B8780E',
      }}
    >
      <Img src={staticFile('coin-shot.png')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.22)', filter: 'contrast(1.08) saturate(1.15)'}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%',
        boxShadow: `inset 0 0 0 ${size * 0.04}px #E3A72A, inset 0 0 0 ${size * 0.055}px #FFE48A, inset 0 0 ${size * 0.1}px rgba(90,50,0,0.6)`}} />
    </div>
  );
  return (
    <div style={{width: size, height: size, position: 'relative', transformStyle: 'preserve-3d', transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`}}>
      {new Array(layers).fill(0).map((_, i) => (
        <div key={i} style={{position: 'absolute', inset: 0, borderRadius: '50%', background: i % 2 ? '#B8780E' : '#9A6208',
          transform: `translateZ(${-T / 2 + (T * (i + 0.5)) / layers}px)`}} />
      ))}
      {face(false)}
      {face(true)}
    </div>
  );
};
