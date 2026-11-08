# Scene & component library

Copy into `src/components/` and adapt. Fuller, tested versions live in `templates/src/components/` (prefer those). All assume `import {...} from 'remotion'` and `ease` from `theme.ts`.

## theme.ts
```ts
import {Easing} from 'remotion';
import {loadFont as loadDisplay} from '@remotion/google-fonts/Montserrat'; // Hebrew: Heebo / Rubik / SecularOne
const display = loadDisplay('normal', {weights: ['800', '900'], subsets: ['latin']});
export const theme = {
  bg: '#0B0B14', bg2: '#1A1033', primary: '#7C5CFF', accent: '#FFD23F', text: '#FFFFFF', muted: 'rgba(255,255,255,.65)',
  font: display.fontFamily, radius: 28,
};
export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1), in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.83, 0, 0.17, 1), back: Easing.bezier(0.34, 1.56, 0.64, 1),
};
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
```

## Kinetic text — masked word rise (the classic AE title)
```tsx
export const MaskedWords: React.FC<{text: string; delay?: number; size?: number; stagger?: number; rtl?: boolean}> =
({text, delay = 0, size = 140, stagger = 4, rtl}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0 0.25em', direction: rtl ? 'rtl' : 'ltr',
      fontFamily: theme.font, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: '-0.03em', color: theme.text}}>
      {words.map((w, i) => {
        const p = interpolate(frame - delay - i * stagger, [0, 18], [0, 1], {...clamp, easing: ease.out});
        return (
          <span key={i} style={{overflow: 'hidden', display: 'inline-block', paddingBottom: '0.08em'}}>
            <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 110}%) rotate(${(1 - p) * 6}deg)`}}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};
```

## Kinetic text — per-letter pop with spring
```tsx
export const PopLetters: React.FC<{text: string; delay?: number; size?: number}> = ({text, delay = 0, size = 160}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  return (
    <div style={{fontFamily: theme.font, fontWeight: 900, fontSize: size, color: theme.text, whiteSpace: 'pre'}}>
      {[...text].map((c, i) => {
        const s = spring({frame: frame - delay - i * 1.5, fps, config: {damping: 11, stiffness: 140}});
        return <span key={i} style={{display: 'inline-block', transform: `scale(${s}) translateY(${(1 - s) * 40}px)`, opacity: Math.min(1, s * 2)}}>{c}</span>;
      })}
    </div>
  );
};
```

## Type slam with camera shake (hook)
```tsx
export const Slam: React.FC<{text: string; at?: number}> = ({text, at = 0}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame - at, [0, 8], [2.6, 1], {...clamp, easing: ease.in});
  const o = interpolate(frame - at, [0, 3], [0, 1], clamp);
  const shake = interpolate(frame - at, [8, 18], [1, 0], clamp);
  const x = noise2D('x', frame * 0.8, 0) * 18 * shake, y = noise2D('y', frame * 0.8, 0) * 18 * shake;
  return <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `translate(${x}px,${y}px)`}}>
    <div style={{transform: `scale(${s})`, opacity: o, fontFamily: theme.font, fontWeight: 900, fontSize: 200, color: theme.text, textAlign: 'center', lineHeight: 0.95}}>{text}</div>
  </AbsoluteFill>;
};
```

## Animated background (always-on depth layer)
```tsx
export const LivingBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const blob = (seed: string, color: string, size: number) => {
    const x = 50 + noise2D(seed, frame * 0.004, 0) * 40, y = 50 + noise2D(seed, 0, frame * 0.004) * 40;
    return <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: '50%',
      background: color, filter: 'blur(120px)', opacity: 0.55, transform: 'translate(-50%,-50%)'}} />;
  };
  return <AbsoluteFill style={{background: `linear-gradient(160deg, ${theme.bg2}, ${theme.bg})`, overflow: 'hidden'}}>
    {blob('a', theme.primary, 900)}{blob('b', theme.accent, 600)}{blob('c', '#00D1FF', 700)}
    <Grain />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.55))'}} />
  </AbsoluteFill>;
};
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
    <svg width="100%" height="100%"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 10} /></filter>
    <rect width="100%" height="100%" filter="url(#g)" /></svg>
  </AbsoluteFill>;
};
```

## Product hero — 3D tilt reveal + light sweep + floating
```tsx
export const ProductHero: React.FC<{src: string; delay?: number}> = ({src, delay = 0}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 200}, durationInFrames: 30});
  const rotY = interpolate(s, [0, 1], [-35, -8]), rotX = interpolate(s, [0, 1], [20, 4]);
  const float = Math.sin((frame / fps) * 1.6) * 14;
  const sweep = interpolate(frame - delay, [20, 50], [-120, 220], clamp);
  return <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', perspective: 1400}}>
    <div style={{transform: `translateY(${(1 - s) * 400 + float}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${0.7 + s * 0.3})`,
      transformStyle: 'preserve-3d', position: 'relative', filter: 'drop-shadow(0 60px 80px rgba(0,0,0,.5))'}}>
      <Img src={src} style={{width: 720, display: 'block', borderRadius: theme.radius}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: theme.radius, mixBlendMode: 'overlay',
        background: `linear-gradient(105deg, transparent ${sweep - 20}%, rgba(255,255,255,.7) ${sweep}%, transparent ${sweep + 20}%)`}} />
    </div>
  </AbsoluteFill>;
};
```
No product image? Build a phone mockup: rounded rect (radius 70, 4px bezel border, dark gradient), notch, and put a mini UI (cards, chart bars) inside animated with stagger.

## Feature callout (line draws, label appears)
```tsx
export const Callout: React.FC<{label: string; x: number; y: number; delay: number; dir?: 1 | -1}> = ({label, x, y, delay, dir = 1}) => {
  const frame = useCurrentFrame();
  const line = interpolate(frame - delay, [0, 12], [0, 1], {...clamp, easing: ease.out});
  const txt = interpolate(frame - delay, [8, 22], [0, 1], {...clamp, easing: ease.out});
  return <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', flexDirection: dir === 1 ? 'row' : 'row-reverse', gap: 16}}>
    <div style={{width: 18, height: 18, borderRadius: 9, background: theme.accent, transform: `scale(${line})`}} />
    <div style={{width: 140 * line, height: 3, background: theme.accent}} />
    <div style={{opacity: txt, transform: `translateX(${(1 - txt) * 30 * dir}px)`, fontFamily: theme.font, fontWeight: 800, fontSize: 44, color: theme.text}}>{label}</div>
  </div>;
};
```

## Number counter
```tsx
const v = Math.round(interpolate(frame - delay, [0, 40], [0, target], {...clamp, easing: ease.out}));
// render v.toLocaleString() + suffix, with tabular-nums: fontVariantNumeric: 'tabular-nums'
```

## Logo reveal (circle mask burst + scale settle)
```tsx
export const LogoReveal: React.FC<{src: string}> = ({src}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const ring = interpolate(frame, [0, 18], [0, 150], {...clamp, easing: ease.out});
  const ringO = interpolate(frame, [10, 24], [1, 0], clamp);
  const s = spring({frame: frame - 6, fps, config: {damping: 12, stiffness: 110}});
  return <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
    <div style={{position: 'absolute', width: 600, height: 600, borderRadius: '50%', border: `6px solid ${theme.accent}`, transform: `scale(${ring / 100})`, opacity: ringO}} />
    <Img src={src} style={{width: 320, transform: `scale(${s})`, filter: `blur(${(1 - Math.min(s, 1)) * 12}px)`}} />
  </AbsoluteFill>;
};
```

## CTA end card
```tsx
export const CTA: React.FC<{tagline: string; button: string; url?: string; logo?: string}> = ({tagline, button, url, logo}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const b = spring({frame: frame - 18, fps, config: {damping: 14}});
  const pulse = 1 + Math.max(0, Math.sin((frame - 40) / 6)) * 0.04 * (frame > 40 ? 1 : 0);
  return <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 48, flexDirection: 'column'}}>
    {logo && <Img src={logo} style={{width: 220}} />}
    <MaskedWords text={tagline} size={96} delay={4} />
    <div style={{transform: `scale(${b * pulse})`, background: theme.accent, color: theme.bg, padding: '28px 64px', borderRadius: 999,
      fontFamily: theme.font, fontWeight: 900, fontSize: 52, boxShadow: `0 20px 60px ${theme.accent}66`}}>{button}</div>
    {url && <div style={{opacity: interpolate(frame, [30, 45], [0, 1], clamp), color: theme.muted, fontFamily: theme.font, fontSize: 40}}>{url}</div>}
  </AbsoluteFill>;
};
```

## Transitions — Ad.tsx skeleton
```tsx
import {TransitionSeries, linearTiming, springTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {fade} from '@remotion/transitions/fade';

export const Ad: React.FC = () => (
  <AbsoluteFill>
    <LivingBackground />
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={70}><Hook /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({direction: 'from-left'})} timing={linearTiming({durationInFrames: 14, easing: ease.inOut})} />
      <TransitionSeries.Sequence durationInFrames={130}><Reveal /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({direction: 'from-bottom'})} timing={springTiming({config: {damping: 200}, durationInFrames: 16})} />
      <TransitionSeries.Sequence durationInFrames={110}><Benefits /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 12})} />
      <TransitionSeries.Sequence durationInFrames={110}><CTA tagline="..." button="..." /></TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
```
Total duration = sum of sequences − sum of transitions. Set it on `<Composition>`.

Custom "zoom-through" transition (AE favorite): at the end of scene A scale the hero element 1→8 with ease.in while opacity of scene B rises; or a brand-colored circle `clipPath: circle(r% at x y)` expanding 0→150% to reveal scene B.

## Root.tsx — multi-format
```tsx
export const RemotionRoot: React.FC = () => (<>
  <Composition id="Vertical" component={Ad} durationInFrames={450} fps={30} width={1080} height={1920} />
  <Composition id="Square" component={Ad} durationInFrames={450} fps={30} width={1080} height={1080} />
  <Composition id="Landscape" component={Ad} durationInFrames={450} fps={30} width={1920} height={1080} />
</>);
```
Make scenes responsive: derive sizes from `const {width, height} = useVideoConfig(); const u = Math.min(width, height) / 1080;` and multiply font sizes / dimensions by `u`.
