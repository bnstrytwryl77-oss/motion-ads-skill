import React from 'react';
import {Composition, Still} from 'remotion';
import {FORMATS} from './theme';
import {Thumbnail} from './Thumbnail';
import {QAGuard} from './components/QAGuard';
import {NewsShort, newsDuration, newsExample} from './templates/NewsShort';
import {Top5, top5Duration, top5Example} from './templates/Top5';
import {ProductAd, productAdDuration, productAdExample} from './templates/ProductAd';
import {ChannelPromo, channelPromoDuration, channelPromoExample} from './templates/ChannelPromo';

// One composition per format, so `npx remotion render <Id>-Square` etc. gives every format.
// Scenes use useLayout() to re-arrange per format. Delete the templates you don't use.
// Every template is wrapped in <QAGuard> so scripts/qa.py can report off-screen text.
const withQA = (C: React.FC<any>) => (props: any) => <QAGuard><C {...props} /></QAGuard>;

const ALL: {id: string; component: React.FC<any>; duration: number; props: any; fromProps?: (p: any) => number}[] = [
  {id: 'News', component: withQA(NewsShort), duration: newsDuration(newsExample), props: newsExample, fromProps: newsDuration},
  {id: 'Top5', component: withQA(Top5), duration: top5Duration(top5Example), props: top5Example, fromProps: top5Duration},
  {id: 'ProductAd', component: withQA(ProductAd), duration: productAdDuration, props: productAdExample},
  {id: 'ChannelPromo', component: withQA(ChannelPromo), duration: channelPromoDuration, props: channelPromoExample},
];

export const RemotionRoot: React.FC = () => (
  <>
    {ALL.flatMap((c) =>
      (Object.keys(FORMATS) as (keyof typeof FORMATS)[]).map((f) => (
        <Composition
          key={`${c.id}-${f}`}
          id={`${c.id}-${f}`}
          component={c.component}
          durationInFrames={c.duration}
          fps={30}
          width={FORMATS[f].width}
          height={FORMATS[f].height}
          defaultProps={c.props as any}
          // length follows the data (`end`), so --props with a longer/shorter script just works
          calculateMetadata={c.fromProps ? ({props}) => ({durationInFrames: c.fromProps!(props)}) : undefined}
        />
      )),
    )}
    <Still id="Thumb" component={Thumbnail} width={1280} height={720}
      defaultProps={{title: 'כל החנות בחינם?!', highlight: 'בחינם?!', kicker: 'חדש', tint: 'gold', brand: 'SORO'}} />
    <Still id="ThumbVertical" component={Thumbnail} width={1080} height={1920}
      defaultProps={{title: 'כל החנות בחינם?!', highlight: 'בחינם?!', kicker: 'חדש', tint: 'gold', brand: 'SORO'}} />
  </>
);
