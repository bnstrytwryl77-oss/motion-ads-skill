import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {clamp, ease, theme, useLayout} from '../theme';

export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);

// ---------------- motion pieces ----------------

/** Scale-in slam (AE "type slam"): starts big + blurred, lands at `at`. */
export const Slam: React.FC<{at: number; from?: number; children: React.ReactNode}> = ({at, from = 2.6, children}) => {
  const f = useCurrentFrame();
  return (
    <div style={{transform: `scale(${interpolate(f - at, [0, 8], [from, 1], {...clamp, easing: ease.in})})`, opacity: interpolate(f - at, [0, 3], [0, 1], clamp),
      filter: `blur(${interpolate(f - at, [0, 8], [16, 0], clamp)}px)`}}>
      {children}
    </div>
  );
};

/** Camera shake that decays after each hit frame. Returns a CSS transform. */
export const useShake = (hits: number[], amp = 20) => {
  const f = useCurrentFrame();
  const k = Math.max(0, ...hits.map((h) => (f >= h + 7 ? interpolate(f, [h + 7, h + 20], [1, 0], clamp) : 0)));
  return `translate(${noise2D('sx', f * 0.9, 0) * amp * k}px, ${noise2D('sy', f * 0.9, 0) * amp * k}px)`;
};

/** Glass info chip that slides in from the reading side. */
export const Chip: React.FC<{text: string; at: number; badge?: string; color?: string; rtl?: boolean}> = ({text, at, badge, color = theme.gold, rtl = true}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const s = spring({frame: f - at, fps, config: {damping: 15, stiffness: 140}});
  const dir = rtl ? 1 : -1;
  const fs = (L.landscape ? 44 : 54) * L.u;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 20 * L.u, direction: rtl ? 'rtl' : 'ltr', opacity: Math.min(1, s * 1.6),
      transform: `translateX(${(1 - s) * 500 * L.u * dir}px) translateY(${noise2D(text, f * 0.02, 0) * 5}px) rotate(${(1 - s) * 6 * dir}deg)`,
      padding: `${20 * L.u}px ${32 * L.u}px`, borderRadius: 28 * L.u, background: 'rgba(14,14,30,0.55)', backdropFilter: 'blur(16px)',
      border: '1.5px solid rgba(255,255,255,0.16)', boxShadow: '0 18px 50px rgba(0,0,0,0.4)', maxWidth: L.w - L.safe.side * 2}}>
      {badge ? (
        <div style={{background: theme.gold, color: theme.bg, fontFamily: theme.font, fontWeight: 900, fontSize: fs * 0.75, padding: `${4 * L.u}px ${18 * L.u}px`, borderRadius: 12 * L.u, whiteSpace: 'nowrap'}}>{badge}</div>
      ) : (
        <div style={{width: 22 * L.u, height: 22 * L.u, borderRadius: '50%', background: color, boxShadow: `0 0 18px ${color}`, flexShrink: 0}} />
      )}
      <span style={{fontFamily: theme.font, fontWeight: 700, fontSize: fs, color: theme.text, whiteSpace: 'nowrap'}}>{text}</span>
    </div>
  );
};

/** Thin top progress bar ("in one minute" feel). */
export const ProgressBar: React.FC<{total: number; rtl?: boolean}> = ({total, rtl = true}) => {
  const f = useCurrentFrame();
  const L = useLayout();
  return (
    <div style={{position: 'absolute', top: L.safe.top * 0.6, left: L.w * 0.13, right: L.w * 0.13, height: 10 * L.u, borderRadius: 5, background: 'rgba(255,255,255,0.15)', overflow: 'hidden'}}>
      <div style={{position: 'absolute', [rtl ? 'right' : 'left']: 0, top: 0, bottom: 0, width: `${(f / total) * 100}%`, background: `linear-gradient(${rtl ? 270 : 90}deg, ${theme.gold}, ${theme.red})`}} />
    </div>
  );
};

export type RevealKind = 'circle' | 'wipe' | 'slide' | 'none';
/** Scene entrance over the previous scene (first `dur` frames). */
export const Reveal: React.FC<{kind: RevealKind; dur?: number; children: React.ReactNode}> = ({kind, dur = 12, children}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, dur], [0, 1], {...clamp, easing: ease.inOut});
  const style: React.CSSProperties =
    kind === 'circle' ? {clipPath: `circle(${p * 120}% at 50% 45%)`}
    : kind === 'wipe' ? {clipPath: `inset(0 0 0 ${(1 - p) * 100}%)`}
    : kind === 'slide' ? {transform: `translateY(${(1 - p) * 100}%)`}
    : {};
  // data-qa-transition lets <QAGuard> skip overlap checks while two scenes are on screen
  return <AbsoluteFill style={style} data-qa-transition={f < dur && kind !== 'none' ? '1' : '0'}>{children}</AbsoluteFill>;
};

/** Lays scenes on the timeline by start time (s); each new scene reveals over the previous one. */
export const Timeline: React.FC<{scenes: {start: number; node: React.ReactNode}[]; end: number; overlap?: number}> = ({scenes, end, overlap = 0.4}) => {
  const kinds: RevealKind[] = ['circle', 'wipe', 'slide'];
  return (
    <>
      {scenes.map((s, i) => {
        const from = i === 0 ? 0 : sec(s.start - overlap);
        const to = sec(i + 1 < scenes.length ? scenes[i + 1].start : end);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from + (i + 1 < scenes.length ? 0 : 1))}>
            <Reveal kind={i === 0 ? 'none' : kinds[i % 3]}>{s.node}</Reveal>
          </Sequence>
        );
      })}
    </>
  );
};

/** Converts absolute timeline seconds into a scene's local frame (scene placed by <Timeline>). */
export const localFrame = (sceneStart: number, overlap = 0.4) => (t: number) => Math.round((t - sceneStart + (sceneStart > 0 ? overlap : 0)) * FPS);

// ---------------- sound ----------------
// Frames from file start to its loudest point (for scripts/make_sfx.py output). Add your own files here.
export const PEAK: Record<string, number> = {
  'sfx/riser.wav': 27, 'sfx/boom.wav': 0, 'sfx/ching.wav': 0, 'sfx/ching-low.wav': 0, 'sfx/shimmer.wav': 2,
  'sfx/tick.wav': 0, 'sfx/pop.wav': 0, 'sfx/swoosh.wav': 5, 'sfx/buzz.wav': 0,
  'sfx/whip.wav': 4, 'sfx/thud.wav': 0, 'sfx/scratch.wav': 4, 'sfx/ding.wav': 0,
};
export type Cue = {t: number; file: string; vol: number; trim?: number};
/** A sound placed so its PEAK lands on visual time t (seconds). */
export const cue = (t: number, file: string, vol: number, trim?: number): Cue => ({t: t - (PEAK[file] ?? 0) / FPS, file, vol, trim});

/**
 * Narration + music + SFX, with ducking: while the narrator speaks SFX drop to 50% and
 * music to 35%; music fades out over the last second.
 */
export const SoundTrack: React.FC<{
  cues: Cue[];
  speech?: [number, number][];
  narration?: string;
  narrationAt?: number;
  music?: string;
  musicVol?: number;
  end: number;
}> = ({cues, speech = [], narration, narrationAt = 0, music, musicVol = 0.5, end}) => {
  const speaking = (t: number) => speech.some(([a, b]) => t >= a + narrationAt - 0.05 && t <= b + narrationAt + 0.1);
  return (
    <>
      {cues.map((c, i) => (
        <Sequence key={i} from={Math.max(0, sec(c.t))} durationInFrames={90} layout="none">
          <Html5Audio src={staticFile(c.file)} trimBefore={c.trim} volume={(f) => c.vol * (speaking(c.t + f / FPS) ? 0.5 : 1)} />
        </Sequence>
      ))}
      {music && (
        <Html5Audio src={staticFile(music)} volume={(f) => {
          const t = f / FPS;
          return musicVol * (speaking(t) ? 0.35 : 1) * interpolate(t, [0, 0.4, end - 1, end], [0, 1, 1, 0], clamp);
        }} />
      )}
      {narration && (
        <Sequence from={sec(narrationAt)} layout="none">
          <Html5Audio src={staticFile(narration)} />
        </Sequence>
      )}
    </>
  );
};
