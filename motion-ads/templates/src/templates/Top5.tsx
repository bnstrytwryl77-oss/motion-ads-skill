import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ProgressBar, Timeline, cue, localFrame, sec} from '../components/Kit';
import {IconName} from '../components/Icons';
import {goldText, theme, useLayout, clamp} from '../theme';
import {AudioAndCaptions, AudioProps, CaptionRoom, HookData, HookScene, OutroData, OutroScene, Tint, TopicScene, bungee, hookCues, outroCues} from './shared';

/**
 * TOP 5 / COUNTDOWN — "5 best X" with a giant glitch rank number per entry.
 * Each entry: rank slams in, name rises, detail chip(s) pop. Times in seconds.
 */
export type Top5Entry = {start: number; rank: number; name: string; nameT: number; details: {t: number; text: string; badge?: string}[]; tint?: Tint; icon?: IconName};
export type Top5Props = AudioProps & {hook: HookData; entries: Top5Entry[]; outro: OutroData; end: number};

export const top5Duration = (p: Top5Props) => sec(p.end);

const Rank: React.FC<{n: number; at: number}> = ({n, at}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const s = spring({frame: f - at, fps, config: {damping: 9, stiffness: 160}});
  const size = (L.vertical ? 380 : 300) * L.u;
  const t: React.CSSProperties = {fontFamily: bungee, fontSize: size, lineHeight: 1, position: 'absolute', left: 0, right: 0, textAlign: 'center'};
  const jitter = interpolate(f - at, [0, 10], [14, 4], clamp);
  return (
    <div style={{position: 'relative', width: size * 1.1, height: size, transform: `scale(${s}) rotate(${(1 - s) * -20}deg)`}}>
      <div style={{...t, color: '#FF2E4D', transform: `translate(${-jitter}px, 3px)`, mixBlendMode: 'screen'}}>#{n}</div>
      <div style={{...t, color: '#00E5FF', transform: `translate(${jitter}px, -3px)`, mixBlendMode: 'screen'}}>#{n}</div>
      <div style={{...t, ...goldText, filter: `drop-shadow(0 0 30px ${theme.gold}88)`}}>#{n}</div>
    </div>
  );
};

const EntryScene: React.FC<{e: Top5Entry; rtl: boolean; total: number}> = ({e, rtl, total}) => {
  const at = localFrame(e.start);
  return (
    <TopicScene
      rtl={rtl}
      big={<Rank n={e.rank} at={at(e.start) + 2} />}
      topic={{start: e.start, tint: e.tint ?? (['night', 'red', 'ocean', 'gold'] as Tint[])[e.rank % 4], num: `#${e.rank}`, tag: `TOP ${total}`, icon: e.icon ?? 'trophy',
        title: {t: e.nameT, text: e.name, highlight: [e.name.split(' ').slice(-1)[0]]}, items: e.details.map((d) => ({...d}))}}
    />
  );
};

export const Top5: React.FC<Top5Props> = (p) => {
  const rtl = p.rtl ?? true;
  const cues = [
    ...hookCues(p.hook),
    ...p.entries.flatMap((e) => [cue(e.start - 0.1, 'sfx/swoosh.wav', 0.5), cue(e.start + 0.15, 'sfx/boom.wav', 0.6), cue(e.start + 0.15, 'sfx/ching.wav', 0.35),
      ...e.details.map((d) => cue(d.t + 0.1, 'sfx/pop.wav', 0.45))]),
    ...outroCues(p.outro),
  ];
  return (
    <AbsoluteFill style={{background: 'black'}}>
      <CaptionRoom on={p.captions}><Timeline end={p.end} scenes={[
        {start: 0, node: <HookScene h={p.hook} rtl={rtl} />},
        ...p.entries.map((e) => ({start: e.start, node: <EntryScene e={e} rtl={rtl} total={p.entries.length} />})),
        {start: p.outro.start, node: <OutroScene o={p.outro} rtl={rtl} />},
      ]} /></CaptionRoom>
      <ProgressBar total={sec(p.end)} rtl={rtl} />
      <AudioAndCaptions {...p} cues={cues} end={p.end} />
    </AbsoluteFill>
  );
};

export const top5Example: Top5Props = {
  rtl: true,
  hook: {line1: '5 הנשקים', t1: 0.1, line2: 'הכי חזקים', t2: 0.9, tag: 'בעונה הזאת', tagT: 1.8},
  entries: [5, 4, 3, 2, 1].map((rank, i) => {
    const s = 3 + i * 2.6;
    return {start: s, rank, name: `נשק מספר ${rank}`, nameT: s + 0.4, details: [{t: s + 1.2, text: rank === 1 ? 'הכי חזק במשחק' : 'נזק גבוה', badge: rank === 1 ? 'מקום 1' : undefined}]};
  }),
  outro: {start: 16, title: 'מסכימים?', titleT: 16.3, sub: 'כתבו בתגובות', subT: 17.2, cta: 'עקבו לעוד!', ctaT: 18.2, brand: 'SORO'},
  end: 20.5,
};
