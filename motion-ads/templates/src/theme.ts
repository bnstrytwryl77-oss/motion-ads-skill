import {Easing, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Heebo';

const {fontFamily} = loadFont('normal', {
  weights: ['400', '700', '900'],
  subsets: ['hebrew', 'latin'],
});

export const theme = {
  bg: '#050B1A',
  gold: '#FFC83D',
  goldLight: '#FFE9A3',
  goldDeep: '#B9780C',
  red: '#E63946',
  ocean: '#14B8C8',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.65)',
  font: fontFamily,
};

export const goldText: React.CSSProperties = {
  backgroundImage: `linear-gradient(180deg, ${theme.goldLight} 10%, ${theme.gold} 50%, ${theme.goldDeep} 95%)`,
  WebkitBackgroundClip: 'text',
  color: 'transparent',
};

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.83, 0, 0.17, 1),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const useUnit = () => {
  const {width, height} = useVideoConfig();
  return Math.min(width, height) / 1080;
};
