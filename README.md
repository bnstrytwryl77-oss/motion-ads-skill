# 🎬 motion-ads — After Effects-style video ads for Claude Code

A [Claude Code](https://claude.com/claude-code) skill that turns a one-line request into a **finished, professional MP4**: ads, promos, YouTube Shorts / TikToks, news explainers, top-5 countdowns, logo reveals, thumbnails, channel avatars and banners — with kinetic typography, 3D, glitch and iris transitions, narration synced to the picture, word-by-word captions, generated music and sound effects on every hit.

Built on [Remotion](https://www.remotion.dev) (React → video). Full Hebrew / RTL support.

> **עברית:** סקיל ל-Claude Code שיוצר פרסומות, שורטים וסרטוני טיקטוק ברמה של After Effects — טקסט מונפש, תלת־ממד, מעברים, קריינות מסונכרנת, כתוביות מילה-במילה, מוזיקה ואפקטים — בכל הפורמטים, עם תמונה ממוזערת ובדיקת איכות אוטומטית, ומרנדר ל-MP4 אמיתי. תמיכה מלאה בעברית.

## What it does

- **4 ready-made templates** — News/explainer Short, Top 5 countdown, 15s Product ad, Channel promo (glitch). Data-driven: fill a JSON, render.
- **Every format from one project** — Vertical 9:16, Square 1:1, Landscape 16:9; layouts re-arrange per format instead of cropping.
- **Thumbnails** — click-worthy 1280×720 and Shorts covers from the same brand system.
- **Automatic narration** — `tts_elevenlabs.py` generates the voice-over through the ElevenLabs API *with exact word timings* (your own API key); or bring any MP3 and `detect_pauses.py` times it.
- **Word-by-word captions** — TikTok/CapCut style, active word pops in your accent color, auto-placed above the platform UI.
- **Background music** — `make_music.py` writes a royalty-free beat (energetic / dark / chill / epic) plus a beat map so cuts land on the beat. Music and SFX automatically **duck** under the voice.
- **Sound design** — `make_sfx.py` synthesizes riser, boom, coin ching, shimmer, tick, pop, swoosh, buzz; each one is placed so its peak lands on the visual hit.
- **Automatic QA** — `qa.py` renders a preview and reports off-screen text, overlapping text, text under the TikTok/Shorts UI, silences and clipping, and builds a contact sheet. It understands motion (fade-ins, masks, transitions, fly-ins) so it doesn't cry wolf.
- **Motion like AE** — expo easing and springs, masked word reveals, type slams with camera shake, 3D product/coin shots, light sweeps, parallax, particles, grain, chromatic-glitch cuts.

## Install

1. Install [Node.js](https://nodejs.org) 18+, Python 3 and [Claude Code](https://claude.com/claude-code). (Optional: `pip install pillow` for QA contact sheets.)
2. Copy the `motion-ads` folder into your Claude skills folder:

   **macOS / Linux**
   ```bash
   git clone https://github.com/bnstrytwryl77-oss/motion-ads-skill.git
   mkdir -p ~/.claude/skills && cp -r motion-ads-skill/motion-ads ~/.claude/skills/
   ```
   **Windows (PowerShell)**
   ```powershell
   git clone https://github.com/bnstrytwryl77-oss/motion-ads-skill.git
   New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
   Copy-Item -Recurse motion-ads-skill\motion-ads "$HOME\.claude\skills\"
   ```
   (No git? Click **Code → Download ZIP**, unzip, and copy the `motion-ads` folder the same way.)
3. Optional, for automatic narration: set your own ElevenLabs key as an environment variable `ELEVENLABS_API_KEY` (never paste it into chat).
4. Start Claude Code and ask for a video. The skill triggers on its own.

## Try it

```
Make a 15-second vertical ad for my coffee shop "Bean There", warm and premium, with music and captions.
```
```
תעשה לי שורט של דקה בעברית על העדכון החדש בפורטנייט, עם קריינות, כתוביות ותמונה ממוזערת
```
```
Top 5 budget gaming mice — vertical and landscape versions.
```

## Repo layout

```
motion-ads/
├── SKILL.md                         # the workflow Claude follows
├── references/                      # motion principles, scene snippets
├── scripts/
│   ├── tts_elevenlabs.py            # narration + exact word timings (ElevenLabs API)
│   ├── detect_pauses.py             # any narration → phrases (+ estimated word times)
│   ├── make_music.py                # royalty-free beat + beat map
│   ├── make_sfx.py                  # royalty-free SFX
│   └── qa.py                        # automatic quality check + contact sheet
└── templates/src/                   # drop-in Remotion src/
    ├── Root.tsx, index.ts           # every template × 3 formats + thumbnails
    ├── theme.ts                     # colors, fonts, easing, useLayout()
    ├── Thumbnail.tsx
    ├── templates/                   # NewsShort, Top5, ProductAd, ChannelPromo, shared scenes
    └── components/                  # Background, Text, Coin, Icons, Kit, Captions, QAGuard, transitions
```

## Notes

- Rendering uses Remotion's headless Chrome. On Windows, very long folder paths can break it; the skill knows the workaround.
- Remotion is free for individuals and small teams; check the [Remotion license](https://www.remotion.dev/license) for company use.
- Only use music, logos and footage you have the rights to. Label AI-generated voice when the platform asks.

## License

MIT — see [LICENSE](LICENSE).
