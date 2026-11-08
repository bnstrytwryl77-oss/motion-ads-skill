import React from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {theme} from '../theme';

type Tint = 'gold' | 'ocean' | 'night' | 'red';

const palettes: Record<Tint, {grad: [string, string]; blobs: [string, string, string]; opacity: number}> = {
  gold: {grad: ['#1E1404', theme.bg], blobs: [theme.gold, '#FF8A1F', theme.goldDeep], opacity: 0.42},
  ocean: {grad: ['#04263A', theme.bg], blobs: [theme.ocean, '#1F4FFF', theme.gold], opacity: 0.4},
  night: {grad: ['#0C1230', '#03050C'], blobs: ['#2B3A8C', theme.goldDeep, '#4A1F5C'], opacity: 0.45},
  red: {grad: ['#2A0709', theme.bg], blobs: [theme.red, theme.goldDeep, '#5C1F3A'], opacity: 0.45},
};

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.08}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={`grain-${frame % 6}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 6} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${frame % 6})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const LivingBackground: React.FC<{tint: Tint}> = ({tint}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const p = palettes[tint];

  const blob = (seed: string, color: string, size: number, i: number) => {
    const x = 50 + noise2D(seed + tint, frame * 0.005, i) * 45;
    const y = 30 + i * 22 + noise2D(seed + tint, i, frame * 0.005) * 25;
    return (
      <div
        key={seed}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          borderRadius: '50%',
          background: color,
          filter: 'blur(140px)',
          opacity: p.opacity,
          transform: 'translate(-50%,-50%)',
        }}
      />
    );
  };

  // Floating particles, 3 depth layers (parallax by speed/size)
  const particles = new Array(28).fill(0).map((_, i) => {
    const depth = 0.3 + random(`d${i}`) * 0.7;
    const x = random(`x${i}`) * width;
    const y0 = random(`y${i}`) * height;
    const y = (((y0 - frame * 1.6 * depth) % height) + height) % height;
    const s = 3 + depth * 6;
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x + noise2D(`p${i}`, frame * 0.01, 0) * 30,
          top: y,
          width: s,
          height: s,
          borderRadius: '50%',
          background: 'white',
          opacity: 0.08 + depth * 0.22,
          filter: depth < 0.5 ? 'blur(2px)' : undefined,
        }}
      />
    );
  });

  return (
    <AbsoluteFill style={{background: `linear-gradient(165deg, ${p.grad[0]}, ${p.grad[1]})`, overflow: 'hidden'}}>
      {blob('a', p.blobs[0], 1000, 0)}
      {blob('b', p.blobs[1], 700, 1)}
      {blob('c', p.blobs[2], 800, 2)}
      {particles}
      <Grain />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.6))'}} />
    </AbsoluteFill>
  );
};
