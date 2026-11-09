import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {loadFont as loadBungee} from '@remotion/google-fonts/Bungee';
import {LivingBackground} from './components/Background';
import {goldText, theme, useLayout} from './theme';

const bungee = loadBungee('normal', {weights: ['400'], subsets: ['latin']}).fontFamily;

/**
 * Click-worthy thumbnail as a <Still>. Register twice in Root.tsx:
 *   <Still id="Thumb" component={Thumbnail} width={1280} height={720} defaultProps={...} />
 *   <Still id="ThumbVertical" component={Thumbnail} width={1080} height={1920} defaultProps={...} />
 * Render: npx remotion still Thumb out/thumb.png
 * Rules: ≤4 big words, one hero image/object, max contrast, readable at 120px wide.
 */
export type ThumbProps = {
  title: string; // 2–4 words, e.g. "כל החנות בחינם?!"
  highlight?: string; // a word from the title shown in the accent color
  kicker?: string; // small red tag, e.g. "חדש" / "NEW"
  image?: string; // file in public/, e.g. "hero.png" (cut-out PNG works best)
  tint?: 'gold' | 'ocean' | 'night' | 'red';
  rtl?: boolean;
  brand?: string; // channel name in the corner
};

export const Thumbnail: React.FC<ThumbProps> = ({title, highlight, kicker, image, tint = 'gold', rtl = true, brand}) => {
  const L = useLayout();
  const words = title.split(' ');
  const textSize = (L.vertical ? 190 : 200) * L.u;
  const textBlock = (
    <div style={{direction: rtl ? 'rtl' : 'ltr', display: 'flex', flexDirection: 'column', alignItems: L.vertical ? 'center' : rtl ? 'flex-start' : 'flex-start', gap: 10 * L.u}}>
      {kicker && (
        <div style={{background: theme.red, color: 'white', fontFamily: theme.font, fontWeight: 900, fontSize: 54 * L.u, padding: `${6 * L.u}px ${26 * L.u}px`,
          borderRadius: 14 * L.u, transform: 'rotate(-3deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>{kicker}</div>
      )}
      <div style={{display: 'flex', flexWrap: 'wrap', gap: `0 ${textSize * 0.25}px`, justifyContent: L.vertical ? 'center' : 'flex-start', maxWidth: L.vertical ? L.w * 0.9 : L.w * 0.6}}>
        {words.map((w, i) => (
          <span key={i} style={{fontFamily: theme.font, fontWeight: 900, fontSize: textSize, lineHeight: 1.0, letterSpacing: '-0.03em',
            WebkitTextStroke: `${textSize * 0.07}px #000`, paintOrder: 'stroke fill', filter: 'drop-shadow(0 12px 0 rgba(0,0,0,0.5))',
            ...(w === highlight ? goldText : {color: 'white'})}}>{w}</span>
        ))}
      </div>
    </div>
  );
  const hero = image ? (
    <Img src={staticFile(image)} style={{height: L.vertical ? L.h * 0.42 : L.h * 0.9, objectFit: 'contain', filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.6))'}} />
  ) : null;
  return (
    <AbsoluteFill>
      <LivingBackground tint={tint} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55))'}} />
      <AbsoluteFill style={{padding: L.safe.side, display: 'flex', flexDirection: L.vertical ? 'column' : rtl ? 'row' : 'row-reverse',
        alignItems: 'center', justifyContent: 'center', gap: 40 * L.u}}>
        {L.vertical ? <>{hero}{textBlock}</> : <>{textBlock}{hero}</>}
      </AbsoluteFill>
      {brand && (
        <div style={{position: 'absolute', bottom: 24 * L.u, [rtl ? 'left' : 'right']: 30 * L.u, fontFamily: bungee, fontSize: 40 * L.u, color: 'white', opacity: 0.85,
          textShadow: `-3px 0 #FF2E4D, 3px 0 #00E5FF`}}>{brand}</div>
      )}
    </AbsoluteFill>
  );
};
