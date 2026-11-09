import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, getRemotionEnvironment, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Wrap a composition's content in <QAGuard> to make scripts/qa.py report problems:
 *  - "overflow": visible text that sticks out of the frame (the #1 bug in generated videos)
 *  - "ui-zone": text inside the bottom 18% of a vertical video (covered by TikTok/Shorts UI)
 *  - "overlap": two different visible texts covering each other (e.g. captions on top of a label)
 * It only logs to the console during renders, so it costs nothing in the final video.
 * Smart about motion: ignores invisible text (ancestor opacity), clips to overflow:hidden masks,
 * skips overlap checks while a <Reveal> transition runs, and qa.py drops "fly-ins"
 * (text that is off-screen and then lands inside the frame).
 */
export const QAGuard: React.FC<{children: React.ReactNode; uiZone?: boolean}> = ({children, uiZone = true}) => {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  useLayoutEffect(() => {
    const host = ref.current;
    if (!getRemotionEnvironment().isRendering || !host) return;
    const root = host.getBoundingClientRect();
    const sx = root.width / width;
    const sy = root.height / height;
    const transitioning = !!host.querySelector('[data-qa-transition="1"]');
    const seen = new Set<string>();
    const boxes: {text: string; x0: number; x1: number; y0: number; y1: number}[] = [];
    host.querySelectorAll<HTMLElement>('*').forEach((el) => {
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 0);
      if (!own) return;
      if (getComputedStyle(el).visibility === 'hidden') return;
      let op = 1;
      let r = el.getBoundingClientRect();
      let left = r.left, right = r.right, top = r.top, bottom = r.bottom;
      for (let n: HTMLElement | null = el; n && n !== host; n = n.parentElement) {
        const cs = getComputedStyle(n);
        op *= Number(cs.opacity);
        if (n !== el && (cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible')) {
          const c = n.getBoundingClientRect(); // clipped by a mask (e.g. masked word reveal)
          left = Math.max(left, c.left); right = Math.min(right, c.right); top = Math.max(top, c.top); bottom = Math.min(bottom, c.bottom);
        }
      }
      if (op < 0.5) return;
      if (![left, right, top, bottom].every(Number.isFinite) || right - left < 2 || bottom - top < 2) return;
      const text = (el.textContent ?? '').trim().slice(0, 40);
      if (seen.has(text)) return;
      seen.add(text);
      const x0 = (left - root.left) / sx;
      const x1 = (right - root.left) / sx;
      const y0 = (top - root.top) / sy;
      const y1 = (bottom - root.top) / sy;
      const tol = 2;
      boxes.push({text, x0, x1, y0, y1});
      if (x0 < -tol || x1 > width + tol || y0 < -tol || y1 > height + tol) {
        console.warn(`[QA] f=${frame} overflow "${text}" x=${Math.round(x0)}..${Math.round(x1)} y=${Math.round(y0)}..${Math.round(y1)} (frame ${width}x${height})`);
      } else {
        console.warn(`[QA] f=${frame} inside "${text}"`);
        if (uiZone && height / width > 1.3 && y1 > height * 0.82) console.warn(`[QA] f=${frame} ui-zone "${text}" y=${Math.round(y0)}..${Math.round(y1)}`);
      }
    });
    if (transitioning) return; // two scenes on screen during a reveal: overlap is expected
    // overlapping different texts (identical texts = intentional ghost/glitch layers, ignored)
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        if (a.text === b.text || a.text.includes(b.text) || b.text.includes(a.text)) continue;
        const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (ix <= 0 || iy <= 0) continue;
        const small = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
        if ((ix * iy) / small > 0.25) console.warn(`[QA] f=${frame} overlap "${a.text} × ${b.text}"`);
      }
    }
  });
  return <AbsoluteFill ref={ref}>{children}</AbsoluteFill>;
};
