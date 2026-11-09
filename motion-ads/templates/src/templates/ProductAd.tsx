import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {LivingBackground} from '../components/Background';
import {Sparkle} from '../components/Coin';
import {Chip, Timeline, cue, localFrame, sec} from '../components/Kit';
import {MaskedWords} from '../components/Text';
import {clamp, ease, goldText, theme, useLayout} from '../theme';
import {AudioAndCaptions, AudioProps, CaptionRoom, HookScene, Tint} from './shared';

/**
 * PRODUCT AD (15s) — hook → problem → product reveal with 3D tilt + light sweep + feature chips
 * → stat counter → CTA. Works with a product image (cut-out PNG in public/) or without (glossy 3D card).
 */
export type ProductAdProps = AudioProps & {
  brand: string;
  tint?: Tint;
  hook: {line1: string; line2: string; tag?: string};
  problems: string[]; // 2–3 short lines
  product: {name: string; image?: string};
  features: string[]; // up to 3
  stat: {value: number; prefix?: string; suffix?: string; label: string};
  cta: {tagline: string; button: string; sub?: string};
};

// Fixed timeline (seconds); stretch by editing these if a narration is longer.
const T = {problem: 2.6, reveal: 5.4, stat: 10.4, cta: 12.8, end: 15.5};
export const productAdDuration = sec(T.end);

const Problem: React.FC<{lines: string[]; rtl: boolean}> = ({lines, rtl}) => {
  const L = useLayout();
  const at = localFrame(T.problem);
  return (
    <AbsoluteFill>
      <LivingBackground tint="night" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 10 * L.u, padding: L.safe.side}}>
        {lines.map((l, i) => (
          <MaskedWords key={i} text={l} size={(L.landscape ? 120 : 140) * L.u} delay={at(T.problem + 0.15 + i * 0.5)} color={i === lines.length - 1 ? theme.text : theme.muted} ltr={!rtl} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const GlossCard: React.FC<{name: string; size: number}> = ({name, size}) => (
  <div style={{width: size, height: size * 1.25, borderRadius: size * 0.12, background: `linear-gradient(140deg, ${theme.gold}, ${theme.red} 60%, #2b1050)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 6px rgba(255,255,255,0.25)'}}>
    <div style={{fontFamily: theme.font, fontWeight: 900, fontSize: size * 0.22, color: 'white', textAlign: 'center', padding: size * 0.08}}>{name}</div>
  </div>
);

const Reveal: React.FC<{p: ProductAdProps; rtl: boolean}> = ({p, rtl}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const at = localFrame(T.reveal);
  const s = spring({frame: f - at(T.reveal + 0.3), fps, config: {damping: 200}, durationInFrames: 32});
  const sweep = interpolate(f, [at(T.reveal + 1), at(T.reveal + 2)], [-40, 140], {...clamp, easing: ease.inOut});
  const size = (L.vertical ? 560 : L.square ? 380 : 480) * L.u;
  const product = (
    <div style={{perspective: 1400 * L.u}}>
      <div style={{position: 'relative', transform: `translateY(${(1 - s) * 700 * L.u + Math.sin(f / 18) * 12 * L.u}px) rotateY(${interpolate(s, [0, 1], [38, 10])}deg) rotateX(${interpolate(s, [0, 1], [24, 5])}deg)`,
        filter: 'drop-shadow(0 60px 80px rgba(0,0,0,0.6))'}}>
        {p.product.image ? <Img src={staticFile(p.product.image)} style={{width: size, height: size, objectFit: 'contain'}} /> : <GlossCard name={p.product.name} size={size * 0.8} />}
        <div style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', pointerEvents: 'none',
          background: `linear-gradient(110deg, transparent ${sweep - 16}%, rgba(255,255,255,0.75) ${sweep}%, transparent ${sweep + 16}%)`}} />
      </div>
    </div>
  );
  return (
    <AbsoluteFill>
      <LivingBackground tint={p.tint ?? 'ocean'} />
      <AbsoluteFill style={{padding: `${L.safe.top}px ${L.safe.side}px ${L.safe.bottom}px`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: L.landscape ? (rtl ? 'row' : 'row-reverse') : 'column', gap: 30 * L.u}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 * L.u}}>
          <MaskedWords text={`הכירו את ${p.product.name}`} size={(L.landscape ? 90 : 110) * L.u} delay={at(T.reveal + 0.1)} highlight={[p.product.name]} ltr={!rtl} />
          {product}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 * L.u}}>
          {p.features.map((t, i) => <Chip key={i} text={t} at={at(T.reveal + 1.6 + i * 0.8)} rtl={rtl} color={[theme.gold, theme.ocean, theme.red][i % 3]} />)}
        </div>
      </AbsoluteFill>
      <Sparkle x={L.w * 0.2} y={L.h * 0.3} size={50 * L.u} delay={30} />
    </AbsoluteFill>
  );
};

const Stat: React.FC<{p: ProductAdProps; rtl: boolean}> = ({p, rtl}) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const at = localFrame(T.stat);
  const v = Math.round(interpolate(f, [at(T.stat + 0.1), at(T.stat + 1.3)], [0, p.stat.value], {...clamp, easing: ease.out}));
  return (
    <AbsoluteFill>
      <LivingBackground tint="gold" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 10 * L.u}}>
        <div style={{fontFamily: theme.font, fontWeight: 900, fontSize: 280 * L.u, lineHeight: 1, direction: 'ltr', fontVariantNumeric: 'tabular-nums',
          filter: `drop-shadow(0 0 40px ${theme.gold}66)`, ...goldText}}>{p.stat.prefix ?? ''}{v.toLocaleString('en-US')}{p.stat.suffix ?? ''}</div>
        <MaskedWords text={p.stat.label} size={70 * L.u} delay={at(T.stat + 0.5)} weight={700} ltr={!rtl} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CTA: React.FC<{p: ProductAdProps; rtl: boolean}> = ({p, rtl}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const at = localFrame(T.cta);
  const btn = spring({frame: f - at(T.cta + 0.9), fps, config: {damping: 12, stiffness: 130}});
  const pulse = f > at(T.cta + 1.6) ? 1 + Math.max(0, Math.sin(f / 7)) ** 3 * 0.045 : 1;
  return (
    <AbsoluteFill>
      <LivingBackground tint="red" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 40 * L.u, direction: rtl ? 'rtl' : 'ltr', padding: L.safe.side}}>
        <MaskedWords text={p.brand} size={170 * L.u} delay={at(T.cta + 0.1)} ltr={!rtl} highlight={[p.brand]} />
        <MaskedWords text={p.cta.tagline} size={80 * L.u} delay={at(T.cta + 0.5)} weight={700} ltr={!rtl} />
        <div style={{transform: `scale(${btn * pulse})`, background: theme.gold, color: theme.bg, fontFamily: theme.font, fontWeight: 900, fontSize: 64 * L.u,
          padding: `${26 * L.u}px ${70 * L.u}px`, borderRadius: 999, boxShadow: `0 24px 70px ${theme.gold}66`}}>{p.cta.button}</div>
        {p.cta.sub && <div style={{opacity: interpolate(f, [at(T.cta + 1.4), at(T.cta + 1.9)], [0, 1], clamp), fontFamily: theme.font, fontSize: 44 * L.u, color: theme.muted}}>{p.cta.sub}</div>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ProductAd: React.FC<ProductAdProps> = (p) => {
  const rtl = p.rtl ?? true;
  const cues = [
    cue(0.1, 'sfx/boom.wav', 0.6), cue(0.9, 'sfx/boom.wav', 0.75), cue(0.9, 'sfx/shimmer.wav', 0.35),
    cue(T.problem, 'sfx/swoosh.wav', 0.5), cue(T.reveal + 1.2, 'sfx/riser.wav', 0.4), cue(T.reveal + 1.2, 'sfx/ching.wav', 0.5),
    ...p.features.map((_, i) => cue(T.reveal + 1.7 + i * 0.8, 'sfx/pop.wav', 0.45)),
    cue(T.stat, 'sfx/swoosh.wav', 0.5), ...[0.2, 0.4, 0.6, 0.8, 1.0, 1.2].map((d) => cue(T.stat + d, 'sfx/tick.wav', 0.4)), cue(T.stat + 1.3, 'sfx/ching.wav', 0.5),
    cue(T.cta, 'sfx/swoosh.wav', 0.5), cue(T.cta + 1.0, 'sfx/boom.wav', 0.5), cue(T.cta + 1.0, 'sfx/shimmer.wav', 0.4),
  ];
  return (
    <AbsoluteFill style={{background: 'black'}}>
      <CaptionRoom on={p.captions}><Timeline end={T.end} scenes={[
        {start: 0, node: <HookScene h={{line1: p.hook.line1, t1: 0.1, line2: p.hook.line2, t2: 0.9, tag: p.hook.tag, tagT: 1.7, coins: false, tint: p.tint}} rtl={rtl} />},
        {start: T.problem, node: <Problem lines={p.problems} rtl={rtl} />},
        {start: T.reveal, node: <Reveal p={p} rtl={rtl} />},
        {start: T.stat, node: <Stat p={p} rtl={rtl} />},
        {start: T.cta, node: <CTA p={p} rtl={rtl} />},
      ]} /></CaptionRoom>
      <AudioAndCaptions {...p} cues={cues} end={T.end} />
    </AbsoluteFill>
  );
};

export const productAdExample: ProductAdProps = {
  rtl: true,
  brand: 'פולס',
  hook: {line1: 'עוד תירוץ?', line2: 'די.', tag: 'שוב מחר?'},
  problems: ['אין זמן.', 'אין כוח.', 'אין תוכנית.'],
  product: {name: 'פולס'},
  features: ['אימונים של 15 דק׳', 'מאמן AI אישי', 'מעקב דופק חי'],
  stat: {value: 500, prefix: '+', suffix: 'K', label: 'מתאמנים כבר בפנים'},
  cta: {tagline: 'הגוף שלך. הקצב שלך.', button: 'הורידו בחינם', sub: '7 ימים ראשונים עלינו'},
};
