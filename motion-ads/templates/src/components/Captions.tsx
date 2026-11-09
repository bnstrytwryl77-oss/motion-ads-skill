import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, theme} from '../theme';

export type Word = {word: string; start: number; end: number};

// Loads public/<file> (from tts_elevenlabs.py or detect_pauses.py --words) before rendering.
export const useWords = (file = 'narration.words.json') => {
  const [words, setWords] = useState<Word[] | null>(null);
  const [handle] = useState(() => delayRender(`load ${file}`));
  useEffect(() => {
    fetch(staticFile(file))
      .then((r) => r.json())
      .then((w: Word[]) => {
        setWords(w);
        continueRender(handle);
      })
      .catch(() => {
        setWords([]);
        continueRender(handle);
      });
  }, [file, handle]);
  return words;
};

// Group words into short on-screen chunks (TikTok/CapCut style)
const chunk = (words: Word[], maxWords: number, maxGap: number) => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const breakHere = cur.length >= maxWords || (prev && (w.start - prev.end > maxGap || /[.!?…]$/.test(prev.word)));
    if (cur.length && breakHere) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
  });
  if (cur.length) out.push(cur);
  return out;
};

/**
 * Word-by-word captions. The active word pops and takes the accent color.
 * Put it ABOVE the platform UI: vertical videos -> bottom ≈ 22–28% of the height.
 * `offset` = seconds to add when the narration starts later than frame 0.
 */
export const Captions: React.FC<{
  words: Word[] | null;
  rtl?: boolean;
  bottom?: number; // px from the bottom of the frame
  size?: number;
  accent?: string;
  maxWords?: number;
  offset?: number;
  /** 'clean' = smooth pop (motion-graphics ads). 'creator' = YouTuber/CapCut look: hard cut-in, thick outline, hard shadow, yellow active word, slight random tilt per chunk. */
  variant?: 'clean' | 'creator';
  /** don't show captions before this time (s) — e.g. while a big hook text already says the same words */
  from?: number;
}> = ({words, rtl = true, bottom, size, accent, maxWords = 3, offset = 0, variant = 'clean', from = 0}) => {
  const frame = useCurrentFrame();
  const {fps, height, width} = useVideoConfig();
  if (!words || !words.length) return null;
  const creator = variant === 'creator';
  const t = frame / fps - offset;
  if (t < from) return null;
  const chunks = chunk(words, maxWords, 0.35);
  const ci = chunks.findIndex((ch, i) => t >= ch[0].start - 0.05 && t < (chunks[i + 1]?.[0].start ?? ch[ch.length - 1].end + 0.6));
  if (ci < 0) return null;
  const c = chunks[ci];
  const u = Math.min(width, height) / 1080;
  const fs = size ?? (creator ? 88 : 78) * u;
  const acc = accent ?? (creator ? '#FFE600' : theme.gold);
  const startF = Math.round((c[0].start + offset) * fps);
  const enter = creator ? 1 : spring({frame: frame - startF, fps, config: {damping: 14, stiffness: 220}});
  const kick = creator ? interpolate(frame - startF, [0, 3], [1.15, 1], clamp) : 0.85 + enter * 0.15;
  const tilt = creator ? (random(`cap${ci}`) - 0.5) * 6 : 0;
  return (
    <div style={{position: 'absolute', left: 60 * u, right: 60 * u, bottom: bottom ?? height * (height > width ? (creator ? 0.27 : 0.24) : 0.1),
      display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: `0 ${fs * 0.42}px`, direction: rtl ? 'rtl' : 'ltr',
      transform: `scale(${kick}) rotate(${tilt}deg)`, opacity: Math.min(1, enter * 2)}}>
      {c.map((w, i) => {
        const active = t >= w.start && t < w.end + 0.08;
        const said = t >= w.start;
        const pop = active ? interpolate(t - w.start, [0, 0.08, 0.18], [1, creator ? 1.12 : 1.18, creator ? 1.06 : 1.1], clamp) : 1;
        return (
          <span key={i} style={{fontFamily: theme.font, fontWeight: 900, fontSize: fs, lineHeight: 1.15, display: 'inline-block',
            color: active ? acc : said || creator ? 'white' : 'rgba(255,255,255,0.75)', transform: `scale(${pop})`,
            WebkitTextStroke: `${fs * (creator ? 0.14 : 0.1)}px ${creator ? 'black' : 'rgba(0,0,0,0.9)'}`, paintOrder: 'stroke fill',
            textShadow: creator ? `0 ${fs * 0.08}px 0 black` : '0 6px 18px rgba(0,0,0,0.6)'}}>
            {w.word}
          </span>
        );
      })}
    </div>
  );
};
