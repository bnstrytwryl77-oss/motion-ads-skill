import React from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {cue, sec} from '../components/Kit';
import {clamp, ease, theme, useLayout} from '../theme';
import {AudioAndCaptions, AudioProps, CaptionRoom, bungee, useBottom} from './shared';

/**
 * CHANNEL PROMO (≈12s, glitch style) — question → 3 fast "what you get" panels with phone cards
 * (use frames from your own videos) → tagline → monogram + brand + follow button.
 * `cuts` are the 6 cut times (s); match them to the narration phrases.
 */
export type ChannelPromoProps = AudioProps & {
  question: {l1: string; big: string; l3: string};
  panels: {image?: string; label: string; live?: boolean}[]; // exactly 3
  tagline: string;
  pre: string; // small line above the logo, e.g. "הכל אצל"
  monogram: string; // 1–3 letters
  brand: string;
  cta: string;
  sub?: string;
  cuts?: number[];
  end?: number;
};

const RED = '#FF2E4D';
const CYAN = '#00E5FF';
const DEFAULT_CUTS = [3.05, 4.3, 5.68, 6.62, 7.75, 9.05];
export const channelPromoDuration = sec(12);

const BG: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLayout();
  return (
    <AbsoluteFill style={{background: '#050508', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -200 * L.u, top: L.h * 0.15 + Math.sin(f / 30) * 60, width: 900 * L.u, height: 900 * L.u, borderRadius: '50%', background: RED, filter: 'blur(220px)', opacity: 0.3}} />
      <div style={{position: 'absolute', right: -200 * L.u, top: L.h * 0.45 + Math.cos(f / 30) * 60, width: 900 * L.u, height: 900 * L.u, borderRadius: '50%', background: CYAN, filter: 'blur(220px)', opacity: 0.25}} />
      <div style={{position: 'absolute', left: -400, right: -400, bottom: -120, height: 700 * L.u, transform: 'perspective(600px) rotateX(62deg)',
        backgroundImage: 'linear-gradient(rgba(0,229,255,0.28) 2px, transparent 2px), linear-gradient(90deg, rgba(255,46,77,0.24) 2px, transparent 2px)',
        backgroundSize: '90px 90px', backgroundPosition: `0 ${f * 4}px`, WebkitMaskImage: 'linear-gradient(to top, black 10%, transparent 90%)'}} />
      <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 7px)'}} />
    </AbsoluteFill>
  );
};

export const GText: React.FC<{children: string; size: number; font?: string; weight?: number; split?: number; dir?: 'rtl' | 'ltr'}> = ({children, size, font = theme.font, weight = 900, split = 6, dir = 'rtl'}) => {
  const f = useCurrentFrame();
  const j = noise2D(children, f * 0.5, 0) * split * 0.5;
  const base: React.CSSProperties = {fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.05, whiteSpace: 'nowrap', direction: dir};
  return (
    <div style={{position: 'relative', display: 'inline-block'}}>
      <div style={{...base, color: RED, position: 'absolute', left: -split + j, top: split * 0.4, mixBlendMode: 'screen'}}>{children}</div>
      <div style={{...base, color: CYAN, position: 'absolute', left: split - j, top: -split * 0.4, mixBlendMode: 'screen'}}>{children}</div>
      <div style={{...base, color: 'white', position: 'relative'}}>{children}</div>
    </div>
  );
};

const Pop: React.FC<{at: number; from?: number; children: React.ReactNode}> = ({at, from = 2.4, children}) => {
  const f = useCurrentFrame();
  return <div style={{transform: `scale(${interpolate(f - at, [0, 7], [from, 1], {...clamp, easing: ease.in})})`, opacity: interpolate(f - at, [0, 2], [0, 1], clamp),
    filter: `blur(${interpolate(f - at, [0, 7], [14, 0], clamp)}px)`}}>{children}</div>;
};

const Panel: React.FC<{image?: string; label: string; live?: boolean; rtl: boolean}> = ({image, label, live, rtl}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const s = spring({frame: f - 2, fps, config: {damping: 14, stiffness: 150}});
  const w = (L.vertical ? 470 : 330) * L.u * (useBottom() > L.safe.bottom ? 0.82 : 1);
  const pulse = 0.6 + Math.abs(Math.sin(f / 5)) * 0.4;
  return (
    <AbsoluteFill style={{display: 'flex', flexDirection: L.landscape ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 50 * L.u, paddingBottom: useBottom()}}>
      <div style={{position: 'relative', width: w, height: w * 1.78, borderRadius: 54 * L.u, overflow: 'hidden', border: `${9 * L.u}px solid #1C1C26`, background: '#111',
        transform: `translateY(${(1 - s) * 900 * L.u + Math.sin(f / 14) * 10}px) rotate(${(1 - s) * 20 - 3}deg)`,
        boxShadow: `0 50px 90px rgba(0,0,0,0.6), -10px 0 40px ${RED}55, 10px 0 40px ${CYAN}55`}}>
        {image && <Img src={staticFile(image)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
        {live && (
          <div style={{position: 'absolute', top: 30 * L.u, right: 20 * L.u, background: RED, color: 'white', fontFamily: bungee, fontSize: 44 * L.u, padding: `${6 * L.u}px ${20 * L.u}px`,
            borderRadius: 12 * L.u, boxShadow: `0 0 ${30 * pulse}px ${RED}`}}>LIVE</div>
        )}
      </div>
      <Pop at={4}><GText size={110 * L.u} split={6} dir={rtl ? 'rtl' : 'ltr'}>{label}</GText></Pop>
    </AbsoluteFill>
  );
};

const GlitchCut: React.FC<{cuts: number[]; children: React.ReactNode}> = ({cuts, children}) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const k = Math.max(0, ...cuts.map((c) => (f >= c && f < c + 5 ? 1 - (f - c) / 5 : 0)));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `translateX(${(random(`gx${f}`) - 0.5) * 60 * k}px)`, filter: k ? `drop-shadow(${14 * k}px 0 0 ${RED}) drop-shadow(${-14 * k}px 0 0 ${CYAN})` : undefined}}>{children}</AbsoluteFill>
      {k > 0 && [0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{position: 'absolute', left: 0, right: 0, top: random(`gy${f}${i}`) * L.h, height: (10 + random(`gh${f}${i}`) * 70) * L.u,
          background: i % 2 ? RED : CYAN, opacity: 0.35 * k, transform: `translateX(${(random(`gb${f}${i}`) - 0.5) * 300}px)`}} />
      ))}
    </AbsoluteFill>
  );
};

export const ChannelPromo: React.FC<ChannelPromoProps> = (p) => {
  const rtl = p.rtl ?? true;
  const dir = rtl ? 'rtl' : 'ltr';
  const cutsS = p.cuts ?? DEFAULT_CUTS;
  const cuts = cutsS.map(sec);
  const end = p.end ?? 12;
  const Brand: React.FC = () => {
    const f = useCurrentFrame();
    const {fps} = useVideoConfig();
    const L = useLayout();
    const logo = spring({frame: f - 2, fps, config: {damping: 11, stiffness: 120}});
    const btn = spring({frame: f - (cuts[5] - cuts[4]), fps, config: {damping: 12, stiffness: 140}});
    const pulse = 1 + Math.max(0, Math.sin(f / 6)) ** 3 * 0.05;
    const m = (L.vertical ? 360 : 260) * L.u;
    return (
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 * L.u, paddingBottom: useBottom()}}>
        <Pop at={0} from={1.5}><GText size={72 * L.u} split={4} weight={700} dir={dir}>{p.pre}</GText></Pop>
        <div style={{position: 'relative', width: m * 2, height: m, display: 'flex', justifyContent: 'center', transform: `scale(${logo})`}}>
          {[RED, CYAN].map((c, i) => (
            <div key={c} style={{position: 'absolute', fontFamily: bungee, fontSize: m, lineHeight: 1, color: c, mixBlendMode: 'screen',
              transform: `translate(${(i ? 14 : -14) + noise2D(c, f * 0.6, 0) * 6}px, ${i ? -5 : 5}px)`}}>{p.monogram}</div>
          ))}
          <div style={{position: 'absolute', fontFamily: bungee, fontSize: m, lineHeight: 1, color: 'white', clipPath: 'inset(0 0 54% 0)'}}>{p.monogram}</div>
          <div style={{position: 'absolute', fontFamily: bungee, fontSize: m, lineHeight: 1, color: 'white', clipPath: 'inset(50% 0 0 0)', transform: `translateX(${14 + Math.sin(f / 3) * 4}px)`}}>{p.monogram}</div>
        </div>
        <div style={{opacity: logo}}><GText size={110 * L.u} font={bungee} weight={400} split={5} dir="ltr">{p.brand}</GText></div>
        <div style={{transform: `scale(${btn * pulse})`, opacity: Math.min(1, btn * 1.5), background: RED, color: 'white', fontFamily: theme.font, fontWeight: 900, fontSize: 76 * L.u,
          padding: `${20 * L.u}px ${64 * L.u}px`, borderRadius: 999, direction: dir, boxShadow: `0 0 50px ${RED}aa, 8px 0 0 ${CYAN}`}}>+ {p.cta}</div>
        {p.sub && <div style={{opacity: btn, fontFamily: theme.font, fontWeight: 700, fontSize: 42 * L.u, color: '#C9C9DA', direction: dir}}>{p.sub}</div>}
      </AbsoluteFill>
    );
  };
  const Question: React.FC = () => {
    const L = useLayout();
    return (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 10 * L.u, paddingBottom: useBottom()}}>
        <Pop at={sec(0.1)} from={1.8}><GText size={100 * L.u} split={4} dir={dir}>{p.question.l1}</GText></Pop>
        <Pop at={sec(0.85)}><GText size={210 * L.u} split={12} dir={dir}>{p.question.big}</GText></Pop>
        <Pop at={sec(1.6)} from={1.6}><GText size={76 * L.u} split={4} weight={700} dir={dir}>{p.question.l3}</GText></Pop>
      </AbsoluteFill>
    );
  };
  const Tag: React.FC = () => {
    const L = useLayout();
    return <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: useBottom()}}><Pop at={2}><GText size={140 * L.u} split={9} dir={dir}>{p.tagline}</GText></Pop></AbsoluteFill>;
  };
  const cues = [
    cue(0.15, 'sfx/pop.wav', 0.5), cue(0.95, 'sfx/boom.wav', 0.75), cue(1.65, 'sfx/pop.wav', 0.5),
    ...cutsS.slice(0, 4).map((c) => cue(c, 'sfx/swoosh.wav', 0.55)), ...cutsS.map((c) => cue(c, 'sfx/buzz.wav', 0.18)),
    cue(cutsS[4], 'sfx/riser.wav', 0.45), cue(cutsS[4] + 0.1, 'sfx/boom.wav', 0.75), cue(cutsS[4] + 0.15, 'sfx/shimmer.wav', 0.45),
    cue(cutsS[5] + 0.15, 'sfx/ching.wav', 0.5),
  ];
  return (
    <AbsoluteFill style={{background: 'black'}}>
      <BG />
      <CaptionRoom on={p.captions}>
      <GlitchCut cuts={cuts}>
        <Sequence durationInFrames={cuts[0]}><Question /></Sequence>
        {p.panels.slice(0, 3).map((pn, i) => (
          <Sequence key={i} from={cuts[i]} durationInFrames={cuts[i + 1] - cuts[i]}><Panel {...pn} rtl={rtl} /></Sequence>
        ))}
        <Sequence from={cuts[3]} durationInFrames={cuts[4] - cuts[3]}><Tag /></Sequence>
        <Sequence from={cuts[4]}><Brand /></Sequence>
      </GlitchCut>
      </CaptionRoom>
      <AudioAndCaptions {...p} cues={cues} end={end} />
    </AbsoluteFill>
  );
};

export const channelPromoExample: ChannelPromoProps = {
  rtl: true,
  question: {l1: 'רוצים לדעת', big: 'ראשונים', l3: 'כל מה שחדש בפורטנייט?'},
  panels: [{label: 'עדכונים חמים'}, {label: 'טיפים שמנצחים'}, {label: 'ולייבים', live: true}],
  tagline: 'הכל בעברית.',
  pre: 'הכל אצל',
  monogram: 'SR',
  brand: 'SORO',
  cta: 'עקבו עכשיו!',
  sub: 'פורטנייט בעברית • עדכונים • טיפים • לייבים',
};
