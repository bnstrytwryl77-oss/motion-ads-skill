import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {evolvePath} from '@remotion/paths';
import {clamp, ease, theme} from '../theme';

/*
 * "Human editor" building blocks — see references/human-style.md.
 * Footage first, zoom punches instead of endless Ken Burns, freeze frames, hand-drawn marks,
 * stickers and screenshot proof. Small imperfections on purpose.
 */

// ---------- camera ----------
/** Subtle handheld camera: slow random drift + micro rotation. amp in px (2–4 looks real). */
export const Handheld: React.FC<{amp?: number; children: React.ReactNode; seed?: string}> = ({amp = 3, children, seed = 'hh'}) => {
  const f = useCurrentFrame();
  const x = noise2D(seed + 'x', f * 0.035, 0) * amp;
  const y = noise2D(seed + 'y', 0, f * 0.035) * amp;
  const r = noise2D(seed + 'r', f * 0.025, 3) * amp * 0.1;
  return <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(1.02)`}}>{children}</AbsoluteFill>;
};

export type Punch = {at: number; scale?: number; hold?: number; x?: number; y?: number}; // at/hold in frames, x/y = focus point in %
/** Zoom punches: instant push-in on an emphasis word (2–3 frames), hold, quick release. */
export const ZoomPunch: React.FC<{punches: Punch[]; children: React.ReactNode}> = ({punches, children}) => {
  const f = useCurrentFrame();
  let s = 1;
  let ox = 50;
  let oy = 50;
  for (const p of punches) {
    const hold = p.hold ?? 24;
    const env = interpolate(f, [p.at, p.at + 3, p.at + 3 + hold, p.at + 7 + hold], [0, 1, 1, 0], {...clamp, easing: ease.out});
    if (env > 0) {
      s = Math.max(s, 1 + ((p.scale ?? 1.15) - 1) * env);
      ox = p.x ?? 50;
      oy = p.y ?? 50;
    }
  }
  return <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: `${ox}% ${oy}%`}}>{children}</AbsoluteFill>;
};

/** Full-frame footage (video or image). `blurfill` = vertical frame with a 16:9 clip centered over a blurred copy. */
export const Footage: React.FC<{src: string; kind?: 'video' | 'image'; from?: number; speed?: number; fit?: 'cover' | 'blurfill'; volume?: number; grade?: boolean}> = ({
  src, kind, from = 0, speed = 1, fit = 'cover', volume = 0, grade = true,
}) => {
  const {fps} = useVideoConfig();
  const isVideo = (kind ?? (/\.(mp4|webm|mov|mkv)$/i.test(src) ? 'video' : 'image')) === 'video';
  const media = (style: React.CSSProperties, muted = false) =>
    isVideo ? (
      <OffthreadVideo src={staticFile(src)} trimBefore={Math.round(from * fps)} playbackRate={speed} volume={muted ? 0 : volume} style={style} />
    ) : (
      <Img src={staticFile(src)} style={style} />
    );
  const look: React.CSSProperties = grade ? {filter: 'contrast(1.06) saturate(1.08)'} : {};
  if (fit === 'cover') return <AbsoluteFill style={look}>{media({width: '100%', height: '100%', objectFit: 'cover'})}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{background: 'black', ...look}}>
      <AbsoluteFill style={{filter: 'blur(40px) brightness(0.55)', transform: 'scale(1.2)'}}>{media({width: '100%', height: '100%', objectFit: 'cover'}, true)}</AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center'}}>{media({width: '100%', objectFit: 'contain'})}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Freeze the children at local frame `at` for `dur` frames with flash + desaturate + slight push. */
export const FreezeFrame: React.FC<{at: number; dur: number; children: React.ReactNode}> = ({at, dur, children}) => {
  const f = useCurrentFrame();
  const on = f >= at && f < at + dur;
  if (!on) return <>{children}</>;
  const p = interpolate(f, [at, at + dur], [0, 1], clamp);
  return (
    <AbsoluteFill style={{filter: `saturate(${0.35}) contrast(1.1)`, transform: `scale(${1.04 + p * 0.03})`}}>
      <Freeze frame={at}>{children}</Freeze>
    </AbsoluteFill>
  );
};

/** One- or two-frame white flash (cut accent). */
export const Flash: React.FC<{at: number[]; frames?: number; opacity?: number}> = ({at, frames = 3, opacity = 0.8}) => {
  const f = useCurrentFrame();
  const o = Math.max(0, ...at.map((a) => (f >= a && f < a + frames ? opacity * (1 - (f - a) / frames) : 0)));
  return o ? <AbsoluteFill style={{background: 'white', opacity: o, pointerEvents: 'none'}} /> : null;
};

/** Whip-pan into the shot: fast horizontal slide with directional blur (first `dur` frames). */
export const Whip: React.FC<{dur?: number; dir?: 1 | -1; children: React.ReactNode}> = ({dur = 7, dir = 1, children}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, dur], [1, 0], {...clamp, easing: ease.out});
  return <AbsoluteFill style={{transform: `translateX(${p * 60 * dir}%)`, filter: p > 0.02 ? `blur(${p * 18}px)` : undefined}}>{children}</AbsoluteFill>;
};

// ---------- hand-drawn marks ----------
const wobble = (seed: string, i: number, amp: number) => (random(`${seed}-${i}`) - 0.5) * amp;

const roughEllipse = (w: number, h: number, seed: string) => {
  // a slightly-off ellipse that overshoots its start, like a quick marker circle
  const pts: string[] = [];
  const n = 28;
  for (let i = 0; i <= n + 4; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI * 0.6;
    const rx = w / 2 + wobble(seed, i, w * 0.06);
    const ry = h / 2 + wobble(seed + 'y', i, h * 0.08);
    pts.push(`${(w / 2 + Math.cos(a) * rx).toFixed(1)} ${(h / 2 + Math.sin(a) * ry).toFixed(1)}`);
  }
  return 'M' + pts.join(' L');
};

export type Mark = {t: number; type: 'circle' | 'arrow' | 'underline' | 'box'; x: number; y: number; w: number; h: number; color?: string; seed?: string};
/** Marker-style annotation drawn on in ~7 frames. x/y/w/h in % of the frame; `t` = local frame to start drawing. */
export const HandMark: React.FC<{m: Mark}> = ({m}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  if (f < m.t) return null;
  const w = (m.w / 100) * width;
  const h = (m.h / 100) * height;
  const seed = m.seed ?? `${m.type}${m.x}${m.y}`;
  const color = m.color ?? '#FF2B2B';
  const p = interpolate(f, [m.t, m.t + 7], [0, 1], {...clamp, easing: ease.out});
  const sw = Math.max(7, Math.min(width, height) * 0.011);
  let d = '';
  if (m.type === 'circle') d = roughEllipse(w, h, seed);
  else if (m.type === 'box') d = `M${wobble(seed, 1, 8)} ${wobble(seed, 2, 8)} L${w + wobble(seed, 3, 10)} ${wobble(seed, 4, 8)} L${w + wobble(seed, 5, 8)} ${h + wobble(seed, 6, 10)} L${wobble(seed, 7, 8)} ${h + wobble(seed, 8, 8)} Z`;
  else if (m.type === 'underline') d = `M0 ${h * 0.6} C ${w * 0.3} ${h * 0.45 + wobble(seed, 1, h * 0.3)}, ${w * 0.7} ${h * 0.75 + wobble(seed, 2, h * 0.3)}, ${w} ${h * 0.5}`;
  else {
    // arrow from top-left to bottom-right of its box, with a hand-drawn head
    const ex = w;
    const ey = h;
    const ang = Math.atan2(ey, ex);
    const hl = Math.min(w, h) * 0.35 + 30;
    d = `M0 0 Q ${w * 0.65 + wobble(seed, 1, w * 0.1)} ${h * 0.1 + wobble(seed, 2, h * 0.1)} ${ex} ${ey}` +
      ` M${ex} ${ey} L${ex - hl * Math.cos(ang - 0.5)} ${ey - hl * Math.sin(ang - 0.5)}` +
      ` M${ex} ${ey} L${ex - hl * Math.cos(ang + 0.5)} ${ey - hl * Math.sin(ang + 0.5)}`;
  }
  const ev = evolvePath(p, d);
  return (
    <svg width={w + sw * 4} height={h + sw * 4} viewBox={`${-sw * 2} ${-sw * 2} ${w + sw * 4} ${h + sw * 4}`}
      style={{position: 'absolute', left: (m.x / 100) * width - sw * 2, top: (m.y / 100) * height - sw * 2, overflow: 'visible', filter: 'drop-shadow(0 3px 0 rgba(0,0,0,0.35))'}}>
      <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
    </svg>
  );
};

// ---------- stickers & proof ----------
/** Tilted label with a white border (cut-out sticker). `hard` = appears on the cut with no animation. */
export const Sticker: React.FC<{text: string; at: number; x: number; y: number; rot?: number; color?: string; textColor?: string; size?: number; hard?: boolean; rtl?: boolean}> = ({
  text, at, x, y, rot = -3, color = '#FFE600', textColor = '#111', size = 64, hard, rtl = true,
}) => {
  const f = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  if (f < at) return null;
  const u = Math.min(width, height) / 1080;
  const s = hard ? 1 : spring({frame: f - at, fps, config: {damping: 9, stiffness: 220}});
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`,
      background: color, color: textColor, fontFamily: theme.font, fontWeight: 900, fontSize: size * u, padding: `${8 * u}px ${24 * u}px`,
      border: `${7 * u}px solid white`, borderRadius: 14 * u, boxShadow: '0 10px 0 rgba(0,0,0,0.25), 0 18px 40px rgba(0,0,0,0.45)', whiteSpace: 'nowrap', direction: rtl ? 'rtl' : 'ltr'}}>
      {text}
    </div>
  );
};

/** Screenshot of the source (patch notes, tweet, shop) as a tilted card; optional marker highlight (x/y/w/h in % of the image). */
export const ScreenshotCard: React.FC<{src: string; at: number; width?: number; rot?: number; from?: 'left' | 'right' | 'bottom'; highlight?: {x: number; y: number; w: number; h: number; t?: number}}> = ({
  src, at, width = 78, rot = -2.5, from = 'bottom', highlight,
}) => {
  const f = useCurrentFrame();
  const {fps, width: W} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {damping: 16, stiffness: 160}});
  const off = (1 - s) * 120;
  const tr = from === 'left' ? `translateX(${-off}%)` : from === 'right' ? `translateX(${off}%)` : `translateY(${off}%)`;
  const hp = highlight ? interpolate(f, [at + (highlight.t ?? 10), at + (highlight.t ?? 10) + 8], [0, 1], {...clamp, easing: ease.out}) : 0;
  const u = W / 1080;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{position: 'relative', width: `${width}%`, transform: `${tr} rotate(${rot}deg)`, border: `${10 * u}px solid white`, borderRadius: 10 * u, background: 'white',
        boxShadow: '0 30px 70px rgba(0,0,0,0.55)'}}>
        <Img src={staticFile(src)} style={{display: 'block', width: '100%'}} />
        {highlight && (
          <div style={{position: 'absolute', left: `${highlight.x}%`, top: `${highlight.y}%`, width: `${highlight.w * hp}%`, height: `${highlight.h}%`,
            background: 'rgba(255,230,0,0.55)', mixBlendMode: 'multiply', borderRadius: 4}} />
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Big hook text in creator style (no animation, or a 3-frame pop) — top third, slightly tilted. */
export const HookText: React.FC<{text: string; at?: number; highlight?: string; rtl?: boolean; y?: number}> = ({text, at = 0, highlight, rtl = true, y = 16}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  if (f < at) return null;
  const u = Math.min(width, height) / 1080;
  const s = interpolate(f - at, [0, 3], [1.25, 1], clamp);
  const size = (height > width ? 104 : 90) * u;
  return (
    <div style={{position: 'absolute', left: '6%', right: '6%', top: `${y}%`, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `0 ${size * 0.3}px`,
      direction: rtl ? 'rtl' : 'ltr', transform: `scale(${s}) rotate(-1.5deg)`}}>
      {text.split(' ').map((w, i) => (
        <span key={i} style={{fontFamily: theme.font, fontWeight: 900, fontSize: size, lineHeight: 1.1, color: w === highlight ? '#FFE600' : 'white',
          WebkitTextStroke: `${size * 0.12}px black`, paintOrder: 'stroke fill', textShadow: `0 ${size * 0.07}px 0 black`}}>{w}</span>
      ))}
    </div>
  );
};
