import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ProgressBar, Timeline, sec} from '../components/Kit';
import {AudioAndCaptions, AudioProps, CaptionRoom, HookData, HookScene, OutroData, OutroScene, Topic, TopicScene, hookCues, outroCues, topicCues} from './shared';

/**
 * NEWS / EXPLAINER SHORT — "everything new in X, in one minute".
 * Hook → numbered chapters (icon, title, chips that pop as they're spoken) → outro with brand + follow.
 * All times are seconds on the narration timeline (from tts_elevenlabs.py or detect_pauses.py).
 */
export type NewsProps = AudioProps & {hook: HookData; topics: Topic[]; outro: OutroData; end: number};

export const newsDuration = (p: NewsProps) => sec(p.end);

export const NewsShort: React.FC<NewsProps> = (p) => {
  const rtl = p.rtl ?? true;
  const cues = [...hookCues(p.hook), ...p.topics.flatMap(topicCues), ...outroCues(p.outro)];
  return (
    <AbsoluteFill style={{background: 'black'}}>
      <CaptionRoom on={p.captions}><Timeline
        end={p.end}
        scenes={[
          {start: 0, node: <HookScene h={p.hook} rtl={rtl} />},
          ...p.topics.map((t) => ({start: t.start, node: <TopicScene topic={t} rtl={rtl} />})),
          {start: p.outro.start, node: <OutroScene o={p.outro} rtl={rtl} />},
        ]}
      /></CaptionRoom>
      <ProgressBar total={sec(p.end)} rtl={rtl} />
      <AudioAndCaptions {...p} cues={cues} end={p.end} />
    </AbsoluteFill>
  );
};

export const newsExample: NewsProps = {
  rtl: true,
  sfx: true,
  hook: {line1: 'העדכון החדש', t1: 0.1, line2: 'כל מה שחדש', t2: 1.0, tag: 'בדקה אחת', tagT: 2.0},
  topics: [
    {start: 3.2, tint: 'ocean', num: '01', tag: 'מפה', icon: 'island', title: {t: 3.5, text: 'אזור חדש', highlight: ['חדש']},
      items: [{t: 4.6, text: 'נקודות חדשות במפה'}, {t: 5.8, text: 'תיבות נדירות', color: '#E63946'}]},
    {start: 7.6, tint: 'red', num: '02', tag: 'נשקים', icon: 'swords', title: {t: 7.9, text: 'נשקים חדשים', highlight: ['חדשים']},
      items: [{t: 9.0, text: 'נשק ראשון', badge: 'חדש'}, {t: 10.1, text: 'נשק שני', badge: 'חדש'}], callout: {t: 11.2, text: 'זמין עכשיו!'}},
  ],
  outro: {start: 12.8, title: 'העדכון יוצא ב-', titleT: 13.1, big: '1.12', bigT: 14.0, cta: 'אל תפספסו!', ctaT: 15.4, brand: 'SORO'},
  end: 17.5,
};
