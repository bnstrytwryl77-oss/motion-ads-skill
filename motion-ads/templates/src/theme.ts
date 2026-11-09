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

// Layout helper for multi-format renders (one composition -> Vertical / Square / Landscape).
// Use `L.u` to scale sizes, `L.vertical` etc. to re-arrange (not just crop), and `L.safe` for margins.
export const useLayout = () => {
  const {width: w, height: h} = useVideoConfig();
  const u = Math.min(w, h) / 1080;
  const vertical = h / w > 1.3;
  const landscape = w / h > 1.3;
  return {
    w, h, u, vertical, landscape, square: !vertical && !landscape,
    // keep text out of platform UI: top 12% / bottom 18% on vertical
    safe: vertical ? {top: h * 0.12, bottom: h * 0.18, side: w * 0.06} : {top: h * 0.08, bottom: h * 0.1, side: w * 0.06},
  };
};

export const FORMATS = {
  Vertical: {width: 1080, height: 1920},
  Square: {width: 1080, height: 1080},
  Landscape: {width: 1920, height: 1080},
} as const;
