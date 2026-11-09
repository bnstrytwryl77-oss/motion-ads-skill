import React, {createContext, useContext} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadBungee} from '@remotion/google-fonts/Bungee';
import {LivingBackground} from '../components/Background';
import {Captions, useWords} from '../components/Captions';
import {CoinRain, Sparkle} from '../components/Coin';
import {Icon, IconName} from '../components/Icons';
import {Chip, Cue, Slam, SoundTrack, cue, localFrame, useShake} from '../components/Kit';
import {MaskedWords} from '../components/Text';
import {clamp, ease, goldText, theme, useLayout} from '../theme';

export const bungee = loadBungee('normal', {weights: ['400'], subsets: ['latin']}).fontFamily;
export type Tint = 'gold' | 'ocean' | 'night' | 'red';

// When captions are on, scenes keep this much space free at the bottom (px).
export const CaptionSpace = createContext(0);
export const useBottom = () => {
  const L = useLayout();
  return Math.max(L.safe.bottom, useContext(CaptionSpace));
};
export const CaptionRoom: React.FC<{on?: boolean; children: React.ReactNode}> = ({on, children}) => {
  const L = useLayout();
  return <CaptionSpace.Provider value={on ? L.h * (L.vertical ? 0.3 : 0.22) : 0}>{children}</CaptionSpace.Provider>;
};

// Shared audio/caption props for every template
export type AudioProps = {
  narration?: string; // file in public/
  speech?: [number, number][]; // phrase times (s) from detect_pauses / tts_elevenlabs
  music?: string; // e.g. "music.wav" from make_music.py
  musicVol?: number;
  captions?: boolean; // word-by-word captions from public/<wordsFile>
  wordsFile?: string;
  sfx?: boolean; // needs public/sfx from make_sfx.py
  rtl?: boolean;
};

export const AudioAndCaptions: React.FC<AudioProps & {cues: Cue[]; end: number}> = ({cues, end, sfx = true, captions, wordsFile, rtl = true, ...a}) => {
  const words = useWords(captions ? wordsFile ?? 'narration.words.json' : '__none__.json');
  return (
    <>
      <SoundTrack cues={sfx ? cues : []} end={end} narration={a.narration} speech={a.speech} music={a.music} musicVol={a.musicVol} />
      {captions && <Captions words={words} rtl={rtl} />}
    </>
  );
};

// ---------------- Hook ----------------
export type HookData = {line1: string; t1: number; line2: string; t2: number; tag?: string; tagT?: number; tint?: Tint; coins?: boolean};
export const HookScene: React.FC<{h: HookData; rtl: boolean}> = ({h, rtl}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const a = Math.round(h.t1 * fps) - 8;
  const b = Math.round(h.t2 * fps) - 8;
  const flash = Math.max(interpolate(f, [a + 7, a + 9, a + 22], [0, 0.3, 0], clamp), interpolate(f, [b + 7, b + 9, b + 22], [0, 0.5, 0], clamp));
  const tag = h.tag ? spring({frame: f - Math.round((h.tagT ?? h.t2 + 0.6) * fps), fps, config: {damping: 12}}) : 0;
  const size = (L.landscape ? 150 : 175) * L.u;
  const bottom = useBottom();
  return (
    <AbsoluteFill>
      <LivingBackground tint={h.tint ?? 'gold'} />
      {h.coins !== false && <CoinRain count={10} seed="hk" opacity={interpolate(f, [b + 8, b + 20], [0, 0.7], clamp)} />}
      <AbsoluteFill style={{background: theme.gold, opacity: flash, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', direction: rtl ? 'rtl' : 'ltr', padding: L.safe.side, paddingBottom: bottom,
        transform: `${useShake([a, b])} scale(${interpolate(f, [0, 200], [1, 1.06])})`}}>
        <Slam at={a}><div style={{fontFamily: theme.font, fontWeight: 900, fontSize: size * 0.8, color: theme.text, lineHeight: 1.05, textAlign: 'center'}}>{h.line1}</div></Slam>
        <Slam at={b}><div style={{fontFamily: theme.font, fontWeight: 900, fontSize: size, lineHeight: 1.15, textAlign: 'center', ...goldText}}>{h.line2}</div></Slam>
        {h.tag && (
          <div style={{marginTop: 40 * L.u, transform: `scale(${tag}) rotate(-3deg)`, opacity: Math.min(1, tag * 1.5), background: theme.red, color: 'white',
            fontFamily: theme.font, fontWeight: 900, fontSize: 72 * L.u, padding: `${12 * L.u}px ${36 * L.u}px`, borderRadius: 20 * L.u, boxShadow: `0 20px 50px ${theme.red}77`}}>{h.tag}</div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------- Topic (chapter) ----------------
export type Item = {t: number; text: string; badge?: string; color?: string};
export type Topic = {
  start: number; tint: Tint; num: string; tag: string; icon: IconName;
  title: {t: number; text: string; highlight?: string[]};
  items: Item[];
  callout?: {t: number; text: string};
};
export const TopicScene: React.FC<{topic: Topic; rtl: boolean; big?: React.ReactNode}> = ({topic, rtl, big}) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const at = localFrame(topic.start);
  const tagIn = interpolate(f, [4, 18], [0, 1], {...clamp, easing: ease.out});
  const call = topic.callout ? spring({frame: f - at(topic.callout.t), fps: 30, config: {damping: 10, stiffness: 140}}) : 0;
  const bottom = useBottom();
  const iconSize = (L.vertical ? 320 : L.square ? 200 : 300) * L.u * (bottom > L.safe.bottom ? 0.8 : 1);
  const head = (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 * L.u, flex: L.landscape ? '0 0 46%' : undefined}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16 * L.u, direction: rtl ? 'rtl' : 'ltr', opacity: tagIn, fontFamily: theme.font, fontWeight: 700, fontSize: 42 * L.u, color: theme.text}}>
        <span style={{fontWeight: 900, ...goldText}}>{topic.num}</span>
        <span style={{width: 46 * L.u, height: 4 * L.u, background: theme.gold, borderRadius: 2}} />
        <span>{topic.tag}</span>
      </div>
      {big ?? <Icon name={topic.icon} size={iconSize} delay={2} />}
      <MaskedWords text={topic.title.text} size={(L.landscape ? 100 : 116) * L.u} delay={at(topic.title.t)} highlight={topic.title.highlight} ltr={!rtl} />
    </div>
  );
  const items = (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 * L.u}}>
      {topic.items.map((it, i) => <Chip key={i} text={it.text} badge={it.badge} color={it.color} at={at(it.t)} rtl={rtl} />)}
      {topic.callout && (
        <div style={{marginTop: 20 * L.u, transform: `scale(${call}) rotate(${(1 - call) * -10 - 2}deg)`, opacity: Math.min(1, call * 1.5), background: theme.red, color: 'white',
          fontFamily: theme.font, fontWeight: 900, fontSize: 64 * L.u, padding: `${20 * L.u}px ${44 * L.u}px`, borderRadius: 24 * L.u, direction: rtl ? 'rtl' : 'ltr',
          boxShadow: `0 24px 60px ${theme.red}77`, whiteSpace: 'nowrap'}}>{topic.callout.text}</div>
      )}
    </div>
  );
  return (
    <AbsoluteFill>
      <LivingBackground tint={topic.tint} />
      <AbsoluteFill style={{transform: `scale(${interpolate(f, [0, 400], [1, 1.05])})`, padding: `${L.safe.top}px ${L.safe.side}px ${bottom}px`,
        display: 'flex', flexDirection: L.landscape ? (rtl ? 'row' : 'row-reverse') : 'column', alignItems: 'center', justifyContent: 'center',
        gap: (L.landscape ? 60 : 34) * L.u}}>
        {head}
        {items}
      </AbsoluteFill>
      <Sparkle x={L.w * 0.25} y={L.h * 0.22} size={50 * L.u} delay={20} />
      <Sparkle x={L.w * 0.75} y={L.h * 0.3} size={40 * L.u} delay={34} />
    </AbsoluteFill>
  );
};

// ---------------- Outro (brand + follow CTA) ----------------
export type OutroData = {start: number; title: string; titleT: number; big?: string; bigT?: number; sub?: string; subT?: number; cta: string; ctaT: number; brand?: string; tint?: Tint};
export const OutroScene: React.FC<{o: OutroData; rtl: boolean}> = ({o, rtl}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const at = localFrame(o.start);
  const big = o.big ? spring({frame: f - at(o.bigT ?? o.titleT + 1), fps, config: {damping: 11, stiffness: 140}}) : 0;
  const sub = interpolate(f, [at(o.subT ?? 99), at(o.subT ?? 99) + 14], [0, 1], clamp);
  const ctaAt = at(o.ctaT) - 4;
  const brand = spring({frame: f - ctaAt - 8, fps, config: {damping: 13}});
  const b = {fontFamily: bungee, fontSize: 110 * L.u, lineHeight: 1, position: 'absolute' as const, letterSpacing: '0.04em'};
  const bottom = useBottom();
  return (
    <AbsoluteFill>
      <LivingBackground tint={o.tint ?? 'red'} />
      <AbsoluteFill style={{transform: useShake([ctaAt], 16), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 24 * L.u, padding: `${L.safe.top}px ${L.safe.side}px ${bottom}px`, direction: rtl ? 'rtl' : 'ltr'}}>
        {!L.landscape && <Icon name="hourglass" size={200 * L.u} delay={2} />}
        <MaskedWords text={o.title} size={100 * L.u} delay={at(o.titleT)} ltr={!rtl} />
        {o.big && (
          <div style={{transform: `scale(${big})`, opacity: Math.min(1, big * 1.6), fontFamily: theme.font, fontWeight: 900, fontSize: 220 * L.u, lineHeight: 1, direction: 'ltr',
            filter: `drop-shadow(0 0 40px ${theme.gold}88)`, ...goldText}}>{o.big}</div>
        )}
        {o.sub && <div style={{opacity: sub, fontFamily: theme.font, fontWeight: 700, fontSize: 52 * L.u, color: theme.text}}>{o.sub}</div>}
        <Slam at={ctaAt}><div style={{fontFamily: theme.font, fontWeight: 900, fontSize: 130 * L.u, color: theme.text, textShadow: `0 0 40px ${theme.red}`}}>{o.cta}</div></Slam>
        {o.brand && (
          <div style={{position: 'relative', width: 520 * L.u, height: 115 * L.u, display: 'flex', justifyContent: 'center', opacity: Math.min(1, brand * 1.5), transform: `scale(${brand})`}}>
            <div style={{...b, color: '#FF2E4D', transform: 'translate(-6px,3px)', mixBlendMode: 'screen'}}>{o.brand}</div>
            <div style={{...b, color: '#00E5FF', transform: 'translate(6px,-3px)', mixBlendMode: 'screen'}}>{o.brand}</div>
            <div style={{...b, color: 'white'}}>{o.brand}</div>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------- default sound design for these scenes ----------------
export const hookCues = (h: HookData): Cue[] => [
  cue(h.t1, 'sfx/boom.wav', 0.6), cue(h.t2, 'sfx/boom.wav', 0.75), cue(h.t2, 'sfx/ching.wav', 0.4), cue(h.t2 + 0.1, 'sfx/shimmer.wav', 0.35),
  ...(h.tag ? [cue(h.tagT ?? h.t2 + 0.6, 'sfx/pop.wav', 0.55)] : []),
];
export const topicCues = (t: Topic, i: number): Cue[] => [
  cue(t.start - 0.1, 'sfx/swoosh.wav', 0.5), cue(t.start + 0.1, 'sfx/pop.wav', 0.35),
  ...t.items.map((it) => cue(it.t + 0.1, i % 2 ? 'sfx/pop.wav' : 'sfx/tick.wav', 0.45)),
  ...(t.callout ? [cue(t.callout.t + 0.15, 'sfx/boom.wav', 0.55), cue(t.callout.t + 0.15, 'sfx/ching.wav', 0.45)] : []),
];
export const outroCues = (o: OutroData): Cue[] => [
  cue(o.start - 0.1, 'sfx/swoosh.wav', 0.5), ...(o.big ? [cue((o.bigT ?? o.titleT + 1) + 0.15, 'sfx/ching.wav', 0.5)] : []),
  cue(o.ctaT + 0.0, 'sfx/riser.wav', 0.45), cue(o.ctaT + 0.0, 'sfx/boom.wav', 0.7), cue(o.ctaT + 0.3, 'sfx/shimmer.wav', 0.4),
];
