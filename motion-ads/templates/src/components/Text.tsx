import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {clamp, ease, theme} from '../theme';

// Classic AE title: each word rises out of a mask, staggered (RTL by default)
export const MaskedWords: React.FC<{
  text: string;
  delay?: number;
  size: number;
  stagger?: number;
  color?: string;
  highlight?: string[];
  highlightColor?: string;
  weight?: number;
  ltr?: boolean;
}> = ({ltr, text, delay = 0, size, stagger = 4, color = theme.text, highlight = [], highlightColor = theme.gold, weight = 900}) => {
  const frame = useCurrentFrame();
  // "|" separates animated chunks (keeps English phrases together in RTL); otherwise split by spaces
  const words = text.includes('|') ? text.split('|') : text.split(' ');
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0 0.26em',
        direction: ltr ? 'ltr' : 'rtl',
        fontFamily: theme.font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: '-0.02em',
        color,
      }}
    >
      {words.map((w, i) => {
        const p = interpolate(frame - delay - i * stagger, [0, 20], [0, 1], {...clamp, easing: ease.out});
        const hl = highlight.includes(w);
        return (
          <span key={i} style={{overflow: 'hidden', display: 'inline-block', padding: '0.06em 0.04em 0.14em'}}>
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${(1 - p) * 115}%) rotate(${(1 - p) * -7}deg)`,
                color: hl ? highlightColor : undefined,
                textShadow: hl ? `0 0 40px ${highlightColor}88` : undefined,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};
