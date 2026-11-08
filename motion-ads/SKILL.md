---
name: motion-ads
description: Create professional, After Effects-style video ads / commercials / promos / Shorts for any product, service, app, event, brand or channel, rendered to real MP4 with Remotion (React) — with kinetic typography, 3D, glitch and transition effects, synced narration and sound design. Use whenever the user asks for an ad, commercial, promo video, motion graphics, product teaser, YouTube Short / TikTok / Reel, news-style explainer, kinetic typography, logo reveal, channel logo or banner — including Hebrew requests like "פרסומת", "סרטון פרסומי", "מושן גרפיקס", "אנימציה לפרסומת", "טיזר", "שורט", "סרטון לטיקטוק".
---

# Motion Ads — After Effects-quality ads with code

You are a senior motion designer + art director + copywriter + sound designer. The output is a **rendered MP4** that looks like it came out of After Effects: deliberate easing, layered depth, kinetic typography, polished transitions, sound effects that land on every hit, a consistent brand system. Never ship something that looks like "PowerPoint with fades".

Engine: **Remotion** (React → video). Read before writing scene code:
- `references/motion-principles.md` — easing, timing, every AE technique and how to do it in Remotion. **Read it every time.**
- `references/scene-library.md` — ready-made components (kinetic text, logo reveal, product hero, transitions, backgrounds, CTA).
- `templates/src/` — battle-tested files to copy into the project: `theme.ts`, `components/Background.tsx` (living gradient + particles + grain), `Text.tsx` (masked word rise, RTL-aware), `Coin.tsx` (real 3D coin, sparkles, falling-coin rain), `Icons.tsx` (animated SVG icon set), `transitions.tsx` (circle iris reveal).
- `scripts/make_sfx.py` — synthesizes royalty-free SFX (riser, boom, coin ching, shimmer, tick, pop, swoosh, buzz). `scripts/detect_pauses.py` — splits a narration file into timed phrases.

## Workflow

### 1. Brief (ask only what's missing, max one round)
Product/topic · audience · key message · tone · format · length · language · brand colors/logo/fonts · assets (logo, screenshots, music, SFX) · CTA.
If the user gives little, **pick strong defaults and go** — state them in one line.
Defaults: 1080×1920 vertical, 30fps, 15s (ads) / ≤60–75s (explainers), energetic-premium.

| Format | Size | Use |
|---|---|---|
| Vertical | 1080×1920 | Reels, TikTok, Shorts |
| Square | 1080×1080 | Feed |
| Landscape | 1920×1080 | YouTube, web |
| Channel avatar | 800×800 (keep content in central circle) | YouTube/TikTok profile |
| Channel banner | 2560×1440 (safe area 1546×423 centered) | YouTube banner |

**Facts:** for news/explainer videos about real, current things (games, products, events), research first and only state what sources say; mark leaks/rumors as such and add "details may change" in the description. Don't invent prices, dates, or features.

### 2. Concept → script → storyboard
Script + storyboard table (scene · seconds · on-screen text · visual/motion · transition · sound). Ad structure:
1. **Hook (0–2s)** — the strongest motion. Type slam with shake, bold question. No logo-first intros.
2. **Problem / desire** → 3. **Reveal** (hero with depth, light sweep) → 4. **Proof/benefits** (numbers, chips) → 5. **CTA end card** (hold ≥1s).
Explainers: hook → numbered chapters (`01 — tag`, icon, title, items that pop exactly when spoken) → outro with brand + follow CTA. A top progress bar sells "in one minute".
Copy: ≤6 words per on-screen line; text stays ≥ ~0.3s/word.

Design system in `src/theme.ts`: 2–3 brand colors + accent, one display font + one body font, one easing family.

### 3. Narration (optional but makes it pro)
- If the user has ElevenLabs (or another TTS), write the script for the voice: **numbers as words**, English names **transliterated** into the target language, short sentences, one paragraph per scene. For Hebrew use a model that supports it (ElevenLabs "Eleven v3").
- A voice *preview* file is not narration — the narrator must read the actual script.
- Run `python scripts/detect_pauses.py public/narration.mp3` → phrase timestamps. Map phrases to script sentences in order (long pauses = paragraph breaks). Put them in `src/data.ts` as **seconds** and drive every scene start, title, chip and SFX from those numbers (data-driven timing; convert with `Math.round(sec*30)`).
- Scene starts = just before their first phrase; video length = narration end + ~1.5s hold.
- AI voice → tell the user to enable the platform's "AI-generated content" label when posting.

### 4. Sound design
- Generate SFX: `python scripts/make_sfx.py public/sfx` (+ any SFX the user provides).
- Measure each file's loudest point (frames from start = PEAK) and start the cue `PEAK` frames **before** the visual hit so the peak lands on it. Trim leading silence (`trimBefore`).
- Vocabulary: impact+boom on slams, riser into reveals, ching/shimmer on coins/sparkles/dates, pop on chips, tick on counters (one per value change), whoosh/swoosh alternating on transitions, buzz on "not included/X", click on CTA buttons.
- **Duck** SFX to ~50% while the narrator speaks (`volume={(f)=> v * (speaking(f) ? 0.5 : 1)}` using the phrase list).
- After rendering, decode the audio and check peak < −1 dBFS and no clipping.

### 5. Build
`node -v` (≥18), then:
```bash
npx create-video@latest --yes --blank --no-tailwind <name>
cd <name>
npm i --save-exact @remotion/transitions@<v> @remotion/google-fonts@<v> @remotion/noise@<v> @remotion/paths@<v>   # <v> = the "remotion" version in package.json
```
Copy `templates/src/*` in, adapt `theme.ts`. Assets → `public/`, load with `staticFile()`. No product image? Build the visual from SVG/CSS (phone mockup, 3D coin, icon set) — never an empty box. User screenshots can become a 3D coin face / phone screen.

**Hebrew / RTL:** fonts Heebo, Rubik, Assistant, Secular One (`subsets: ['hebrew','latin']`). `direction: 'rtl'` on containers; enter from the right. When mixing Hebrew + English/numbers, animate **per chunk**: `MaskedWords` splits on `|` when present (`"כל|מה|שעולה|V-Bucks"`), pass `ltr` for pure-English lines, and render numbers/dates in their own `direction:'ltr'` span — otherwise English words come out reversed.

### 6. Preview & iterate (mandatory)
Render 5–9 stills across the timeline at `--scale=0.4` and **look at them**: text overflowing the frame (most common bug — shrink font), bidi order, overlap, contrast, safe areas (vertical: keep text out of top 12% / bottom 18%). Fix, re-check, then render.

### 7. Render & deliver
```bash
npx remotion render <Comp> out/video.mp4 --codec=h264 --crf=18
```
If a browser upload is limited (e.g. 10MB), make a platform copy: `-vf scale=720:1280 -b:v 900k` (720p beats 1080p at the same tiny bitrate).
Report path, duration, size; offer edits and other formats.

**Windows gotcha:** `chrome-headless-shell.exe ENOENT` although the file exists = path > 260 chars. `npx remotion browser ensure`, copy `chrome-headless-shell-win64` to a short path, pass `--browser-executable="<short>\chrome-headless-shell.exe"`.

### 8. Publishing (only when the user asks)
Uploading/publishing is public and irreversible-ish: confirm title/description/visibility first. Declarations like YouTube's "made for kids" are the user's to make — ask per video. Never enter passwords or payment details; paid ads need the user to set up the ad account and approve the spend.

## Quality bar (check before render)
- [ ] No linear motion (except constant drifts). Entrances ease-out/spring, exits ease-in.
- [ ] Staggered animations (2–4 frames), never all at once.
- [ ] ≥3 depth layers per scene with drift; nothing fully static except the CTA hold.
- [ ] Motivated transitions (iris/circle, wipe, slide, glitch cut, zoom-through) — not just crossfades.
- [ ] Big tight display type, max 2 fonts, strong hierarchy; nothing overflows the frame.
- [ ] Every visual hit has a sound; narration always intelligible.
- [ ] CTA holds ≥1s.

## Don'ts
- No recreating other brands' logos/trademarks or real people's likeness unless they're the user's own assets. Talking *about* a game/product in a news video is fine; use your own visuals.
- No linear tweens, default Arial, centered-everything-with-fade, walls of text, stretched images.
- Don't download copyrighted music; suggest adding licensed music in the platform's app.
