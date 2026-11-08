# 🎬 motion-ads — After Effects-style video ads for Claude Code

A [Claude Code](https://claude.com/claude-code) skill that turns a one-line request into a **finished, professional MP4**: ads, promos, YouTube Shorts / TikToks, news explainers, logo reveals, channel avatars and banners — with kinetic typography, 3D, glitch and iris transitions, narration synced to the picture and sound effects on every hit.

Built on [Remotion](https://www.remotion.dev) (React → video). Full Hebrew / RTL support.

> **עברית:** סקיל ל-Claude Code שיוצר פרסומות, שורטים וסרטוני טיקטוק ברמה של After Effects — טקסט מונפש, תלת־ממד, מעברים, קריינות מסונכרנת ואפקטים קוליים — ומרנדר אותם ל-MP4 אמיתי. תמיכה מלאה בעברית.

## What it does

- **Creative pass first** — writes the script and storyboard (hook → reveal → proof → CTA), picks a design system.
- **Motion like AE** — expo easing and springs, masked word reveals, type slams with camera shake, 3D product/coin shots, light sweeps, parallax, particles, grain, chromatic-glitch cuts.
- **Narration sync** — splits your voice-over into phrases (`scripts/detect_pauses.py`) and times every title, chip and transition to the exact word.
- **Sound design** — synthesizes royalty-free SFX (`scripts/make_sfx.py`: riser, boom, coin ching, shimmer, tick, pop, swoosh, buzz), lands each one on its visual hit and ducks it under the voice.
- **Checks its own work** — renders stills, looks at them, fixes overflow / RTL / overlap, checks audio levels, then renders.
- **Branding too** — channel avatar (800×800) and banner (2560×1440 with safe area).

## Install

1. Install [Node.js](https://nodejs.org) 18+ and [Claude Code](https://claude.com/claude-code).
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
3. Start Claude Code and ask for a video. The skill triggers on its own.

## Try it

```
Make a 15-second vertical ad for my coffee shop "Bean There", warm and premium.
```
```
תעשה לי שורט של דקה בעברית על העדכון החדש בפורטנייט, עם קריינות ואפקטים
```
```
Design a YouTube channel logo and a matching banner for my gaming channel.
```

Have a voice-over (e.g. from ElevenLabs), a logo, screenshots or sound effects? Give Claude the file paths and they'll be built in.

## Repo layout

```
motion-ads/
├── SKILL.md                     # the workflow Claude follows
├── references/
│   ├── motion-principles.md     # easing, timing, AE technique → Remotion recipes
│   └── scene-library.md         # component snippets
├── scripts/
│   ├── make_sfx.py              # royalty-free SFX generator (pure Python)
│   └── detect_pauses.py         # narration → timed phrases
└── templates/src/               # tested components to copy into a project
    ├── theme.ts
    └── components/ (Background, Text, Coin, Icons, transitions)
```

## Notes

- Rendering uses Remotion's headless Chrome. On Windows, very long folder paths can break it; the skill knows the workaround.
- Remotion is free for individuals and small teams; check the [Remotion license](https://www.remotion.dev/license) for company use.
- Only use music, logos and footage you have the rights to.

## License

MIT, see [LICENSE](LICENSE).
