import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Grain} from '../components/Background';
import {Flash, Footage, FreezeFrame, HandMark, Handheld, HookText, Mark, ScreenshotCard, Sticker, Whip, ZoomPunch} from '../components/Creator';
import {Cue, cue, sec} from '../components/Kit';
import {AudioAndCaptions, AudioProps} from './shared';

/**
 * CREATOR SHORT — looks human-edited, not generated (see references/human-style.md).
 * A list of footage shots cut hard on the voice, with zoom punches, freeze frames, hand-drawn marks,
 * stickers, screenshot proof, creator captions and a handheld camera. All times in SECONDS on the
 * narration timeline; positions in % of the frame.
 */
export type Shot = {
  start: number; // shot starts (hard cut) at this time; it runs until the next shot's start
  src: string; // file in public/: gameplay clip, screen recording, photo, facecam
  from?: number; // seconds into the source clip
  speed?: number; // 1.5–2 to speed through boring parts
  fit?: 'cover' | 'blurfill'; // blurfill: 16:9 clip on a 9:16 frame
  enter?: 'cut' | 'flash' | 'whip';
  punches?: {t: number; scale?: number; hold?: number; x?: number; y?: number}[]; // t = seconds; hold = seconds
  freeze?: {t: number; dur: number; label?: string}; // "look at this" moment
  marks?: (Omit<Mark, 't'> & {t: number})[];
  stickers?: {t: number; text: string; x: number; y: number; rot?: number; color?: string; hard?: boolean}[];
  screenshot?: {t: number; src: string; highlight?: {x: number; y: number; w: number; h: number}};
  hook?: {text: string; highlight?: string}; // big text on the very first shot
  handheld?: boolean;
};
export type CreatorProps = AudioProps & {shots: Shot[]; end: number; footageVolume?: number};

export const creatorDuration = (p: CreatorProps) => sec(p.end);

const ShotView: React.FC<{s: Shot; rtl: boolean; vol: number}> = ({s, rtl, vol}) => {
  const L = (t: number) => sec(t - s.start); // narration time -> local frame
  const footage = (
    <ZoomPunch punches={(s.punches ?? []).map((p) => ({at: L(p.t), scale: p.scale, hold: sec(p.hold ?? 0.8), x: p.x, y: p.y}))}>
      <Footage src={s.src} from={s.from} speed={s.speed} fit={s.fit} volume={vol} />
    </ZoomPunch>
  );
  const frozen = s.freeze ? <FreezeFrame at={L(s.freeze.t)} dur={sec(s.freeze.dur)}>{footage}</FreezeFrame> : footage;
  const cam = s.handheld === false ? frozen : <Handheld>{frozen}</Handheld>;
  const body = (
    <AbsoluteFill style={{background: 'black', overflow: 'hidden'}}>
      {cam}
      {s.screenshot && <ScreenshotCard src={s.screenshot.src} at={L(s.screenshot.t)} highlight={s.screenshot.highlight ? {...s.screenshot.highlight, t: 12} : undefined} />}
      {(s.marks ?? []).map((m, i) => <HandMark key={i} m={{...m, t: L(m.t)}} />)}
      {s.freeze?.label && <Sticker text={s.freeze.label} at={L(s.freeze.t)} x={50} y={40} rot={-4} color="#FF2B2B" textColor="white" hard rtl={rtl} />}
      {(s.stickers ?? []).map((st, i) => <Sticker key={i} {...st} at={L(st.t)} rtl={rtl} />)}
      {s.hook && <HookText text={s.hook.text} highlight={s.hook.highlight} rtl={rtl} />}
      <Flash at={[0, ...(s.freeze ? [L(s.freeze.t)] : [])].filter((a, i) => i > 0 || s.enter === 'flash')} />
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
  return s.enter === 'whip' ? <Whip dir={rtl ? -1 : 1}>{body}</Whip> : body;
};

/** Progress-free, logo-free: creator videos don't carry template chrome. */
export const CreatorShort: React.FC<CreatorProps> = (p) => {
  const rtl = p.rtl ?? true;
  useCurrentFrame();
  const cues: Cue[] = p.shots.flatMap((s, i) => [
    ...(i > 0 && s.enter === 'whip' ? [cue(s.start, 'sfx/whip.wav', 0.6)] : []),
    ...(i > 0 && s.enter === 'flash' ? [cue(s.start, 'sfx/swoosh.wav', 0.45)] : []),
    ...(s.punches ?? []).slice(0, 1).map((pn) => cue(pn.t, 'sfx/thud.wav', 0.55)), // only the first punch per shot gets a hit
    ...(s.freeze ? [cue(s.freeze.t, 'sfx/scratch.wav', 0.6)] : []),
    ...(s.stickers ?? []).filter((st) => !st.hard).map((st) => cue(st.t, 'sfx/pop.wav', 0.45)),
    ...(s.screenshot ? [cue(s.screenshot.t + 0.1, 'sfx/swoosh.wav', 0.4)] : []),
  ]);
  return (
    <AbsoluteFill style={{background: 'black'}}>
      {p.shots.map((s, i) => {
        const from = sec(s.start);
        const to = sec(i + 1 < p.shots.length ? p.shots[i + 1].start : p.end);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)}>
            <ShotView s={s} rtl={rtl} vol={p.footageVolume ?? 0} />
          </Sequence>
        );
      })}
      <AudioAndCaptions {...p} captions={p.captions ?? true} captionStyle={p.captionStyle ?? 'creator'}
        // the hook text already shows the first line, so captions start with the second shot
        captionsFrom={p.captionsFrom ?? (p.shots[0]?.hook && p.shots[1] ? p.shots[1].start : 0)} cues={cues} end={p.end} />
    </AbsoluteFill>
  );
};

// Example uses placeholder files: put your own clips/screenshots in public/ and edit the names.
export const creatorExample: CreatorProps = {
  rtl: true,
  captions: false,
  shots: [
    {start: 0, src: 'clip1.mp4', from: 2, hook: {text: 'אף אחד לא מדבר על זה', highlight: 'זה'}, punches: [{t: 0.6, scale: 1.18, hold: 0.7}]},
    {start: 2.2, src: 'clip2.mp4', enter: 'whip', marks: [{t: 2.6, type: 'circle', x: 35, y: 40, w: 30, h: 16}], stickers: [{t: 3.0, text: 'חדש!', x: 70, y: 30, rot: 4}]},
    {start: 4.6, src: 'clip1.mp4', from: 8, freeze: {t: 5.2, dur: 0.9, label: 'רגע...'}, punches: [{t: 6.3, scale: 1.2, x: 50, y: 45}]},
    {start: 7.4, src: 'shot.png', screenshot: {t: 7.5, src: 'shot.png'}, enter: 'flash'},
  ],
  end: 10,
};
