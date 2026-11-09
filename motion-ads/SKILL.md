---
name: motion-ads
description: Create professional, human-looking (not AI-looking) video ads / commercials / promos / Shorts for any product, service, app, event, brand or channel, rendered to real MP4 with Remotion (React) — kinetic typography, 3D, glitch and transition effects, synced narration, word-by-word captions, generated music and sound design, every format (vertical/square/landscape) plus thumbnails, with an automatic quality check. Use whenever the user asks for an ad, commercial, promo video, motion graphics, product teaser, YouTube Short / TikTok / Reel, news-style explainer, top-5 / countdown video, kinetic typography, logo reveal, thumbnail, channel logo or banner — including Hebrew requests like "פרסומת", "סרטון פרסומי", "מושן גרפיקס", "אנימציה לפרסומת", "טיזר", "שורט", "סרטון לטיקטוק", "תמונה ממוזערת".
---

# Motion Ads — After Effects-quality ads with code

You are a senior video editor + motion designer + copywriter + sound designer. The output is a **rendered MP4** that looks made by a skilled human — never "PowerPoint with fades" and never "AI slop".

**Pick the look first:**
- **Creator style (default for channel/creator content: Shorts, TikToks, gaming, reviews, news)** — footage-first, hard cuts on the voice, zoom punches, freeze frames, hand-drawn marks, stickers, screenshot proof, YouTuber captions, a little handheld camera. **Read `references/human-style.md`** — it lists the tells that make videos look AI-generated and what to do instead. Use the `Creator` template + `components/Creator.tsx`.
- **Motion-graphics style (brand/product ads, logo reveals, promos without footage)** — polished After Effects motion: kinetic type, 3D, transitions. Use the other templates.
For creator style, ask the user for real material: gameplay clips (e.g. Fortnite replays / Game Bar / NVIDIA clips), screen recordings, photos, facecam, screenshots of the sources, ideally their own voice recording. Without footage the video will look generated — say so.

Engine: **Remotion** (React → video). Know what's in this skill before writing code:

| Path | What it is |
|---|---|
| `references/motion-principles.md` | Easing, timing, every AE technique → Remotion recipe. **Read every time.** |
| `references/human-style.md` | **Anti-AI guide**: what makes videos look generated and the creator editing grammar that fixes it |
| `references/scene-library.md` | Snippets for custom scenes |
| `templates/src/` | A ready Remotion `src/` folder — copy it in as-is (see §5) |
| `templates/src/templates/` | **Ready-made videos** driven by props: `CreatorShort` (human-edited, footage-first), `NewsShort`, `Top5`, `ProductAd`, `ChannelPromo` (+ `shared.tsx` scenes) |
| `templates/src/Thumbnail.tsx` | Thumbnail `<Still>` (1280×720 and 1080×1920) |
| `templates/src/components/` | `Creator` (**Footage**, Handheld, **ZoomPunch**, **FreezeFrame**, Flash, Whip, **HandMark** circle/arrow/underline/box, **Sticker**, **ScreenshotCard**, HookText) · `Background` (gradient/particles/grain) · `Text` (masked words, RTL) · `Coin` (3D coin, sparkles) · `Icons` · `Kit` (Slam, shake, Chip, ProgressBar, Reveal/Timeline, **SoundTrack with ducking**) · `Captions` (word-by-word, `clean` or `creator` variant) · `QAGuard` · `transitions` |
| `scripts/tts_elevenlabs.py` | Narration via ElevenLabs API **with exact word timings** (needs the user's `ELEVENLABS_API_KEY` env var) |
| `scripts/detect_pauses.py` | Phrase timings from any narration file; `--words script.txt` adds estimated per-word timings |
| `scripts/make_music.py` | Royalty-free background beat (+ beat map) by mood/BPM |
| `scripts/make_sfx.py` | Royalty-free SFX: riser, boom, ching, shimmer, tick, pop, swoosh, buzz + creator-style whip, thud, scratch, ding |
| `scripts/qa.py` | One-command QA: off-screen/overlapping text, contact sheet, audio levels |

## Workflow

### 1. Brief (ask only what's missing, max one round)
Product/topic · audience · key message · tone · format(s) · length · language · brand colors/logo/fonts · assets (logo, screenshots, music, SFX, voice) · CTA.
If the user gives little, **pick strong defaults and go** — state them in one line.
Defaults: 1080×1920 vertical, 30fps, 15s (ads) / ≤60–75s (explainers), energetic-premium, captions on for narrated videos.

| Format | Size | Use |
|---|---|---|
| Vertical | 1080×1920 | Reels, TikTok, Shorts |
| Square | 1080×1080 | Feed |
| Landscape | 1920×1080 | YouTube, web |
| Thumbnail | 1280×720 (+1080×1920 cover) | YouTube / Shorts cover |
| Channel avatar | 800×800 (content in the central circle) | profile |
| Channel banner | 2560×1440 (safe area 1546×423 centered) | YouTube banner |

**Facts:** for news/explainers about real, current things, research first and only state what sources say; mark leaks/rumors and add "details may change" to the description. Don't invent prices, dates or features.

### 2. Pick a template or go custom
| Request | Start from |
|---|---|
| Channel Short/TikTok with footage (gaming, review, news, reaction) | **`CreatorShort`** (shots cut on the voice; punches, freeze, marks, stickers, screenshot proof) |
| "Everything new in X" without footage | `NewsShort` (hook → numbered chapters → outro) |
| "Top 5 …", ranking, countdown | `Top5` |
| Product / app / service ad (15s) | `ProductAd` (hook → problem → 3D reveal + features → stat → CTA) |
| Channel/page promo, "follow us" | `ChannelPromo` (glitch style, phone cards with real frames) |
| Anything else | custom scenes built from `components/` + `shared.tsx` |
Templates are **data-driven**: write a props JSON (times in seconds) and render with `--props=props.json`. Re-skin via `theme.ts` (colors/fonts). Duration follows the data (`end`).

Script/storyboard first (scene · seconds · on-screen text · motion · transition · sound). Hook in the first 2s, ≤6 words per on-screen line, CTA holds ≥1s.

### 3. Voice, words and timing
- **Automatic (best):** if the user has set `ELEVENLABS_API_KEY` themselves, run
  `python scripts/tts_elevenlabs.py script.txt public/narration.mp3 --voice "Roger" --model eleven_v3`
  → MP3 + `narration.words.json` (exact word times) + `narration.phrases.json`. Never ask for, print or store the key.
- **Manual:** the user generates the MP3 in their TTS app → `python scripts/detect_pauses.py public/narration.mp3 --words script.txt` → phrases + estimated word times.
- Script for TTS: numbers as words, English names transliterated, one short paragraph per scene; Hebrew needs `eleven_v3`. A voice *preview* is not narration.
- **Sound human:** the user's own recorded voice beats any TTS. With TTS: stability 0.3–0.4 (default 0.35), vary sentence length, write like the creator talks (first person, slang, opinions), `...` for pauses and a few eleven_v3 audio tags (`[excited]`, `[laughs]`, `[whispers]`, `[sighs]`) — tags are stripped from captions automatically.
- Map phrases to scenes: scene start ≈ just before its first phrase; every title/chip time = when it's said. Video `end` = last word + ~1.5s.
- AI voice → remind the user to switch on the platform's "AI-generated content" label.

### 4. Sound: music + SFX + ducking
- SFX: `python scripts/make_sfx.py public/sfx`. Music: `python scripts/make_music.py public/music.wav --seconds <end> --bpm 120 --mood energetic|dark|chill|epic` (writes a `.beats.json`; at 30fps one beat = 1800/BPM frames — put big cuts on beats/bars). User-supplied licensed music works the same.
- Use `<SoundTrack>` (Kit) or the templates' `AudioAndCaptions`: SFX placed by **visual hit time** with `cue(t, file, vol)` (it subtracts each file's PEAK so the loudest point lands on the hit); while the narrator speaks SFX duck to 50% and music to 35%; music fades out at the end.
- Vocabulary: boom on slams, riser into reveals, ching/shimmer on coins/dates/logos, pop on chips, tick per counter step, swoosh on transitions, buzz on "not included", click on buttons.

### 5. Build
`node -v` (≥18), then:
```bash
npx create-video@latest --yes --blank --no-tailwind <name>
cd <name>
npm i --save-exact @remotion/transitions@<v> @remotion/google-fonts@<v> @remotion/noise@<v> @remotion/paths@<v>   # <v> = "remotion" version in package.json
```
Replace `src/` with `templates/src/` (it has `index.ts`, `Root.tsx` registering every template in all 3 formats + thumbnails, all wrapped in `<QAGuard>`). Delete templates you don't use. Assets → `public/` via `staticFile()`. No product image? Templates fall back to a glossy 3D card; custom scenes build visuals from SVG/CSS — never an empty box.

**Multi-format:** every composition exists as `<Id>-Vertical`, `<Id>-Square`, `<Id>-Landscape`. Scenes use `useLayout()` (`u` scale, `vertical/square/landscape`, `safe` margins) to **re-arrange**, not just crop (e.g. landscape = side-by-side columns).

**Captions:** `captions: true` in props (reads `public/narration.words.json`); `captionStyle: 'creator'` for the YouTuber look (default in CreatorShort, which also starts captions after the hook text). Word-by-word chunks of ≤3 words, active word pops in the accent color, positioned above platform UI. With captions on, templates reserve a bottom band (`CaptionRoom`) so nothing collides. Skip captions when the on-screen text already shows every spoken word in the same place.

**Thumbnail:** `npx remotion still Thumb out/thumb.png --props=thumb.json` with `{title (2–4 words), highlight, kicker, image (cut-out PNG or a strong frame from the video), tint, brand}`. Also `ThumbVertical` for Shorts covers.

**Hebrew / RTL:** Heebo/Rubik/Assistant/Secular One with `subsets: ['hebrew','latin']`; `rtl` prop on templates; enter from the right. Mixed Hebrew + English/numbers: `MaskedWords` splits on `|` (`"כל|מה|שעולה|V-Bucks"`), `ltr` for pure-English lines, numbers/dates in their own `direction:'ltr'` span.

### 6. Automatic QA (mandatory before the final render)
```bash
python scripts/qa.py <Id>-Vertical --props props.json [--browser-executable "<short path>"]
```
Renders a fast preview and reports: text **off-screen**, **overlapping** text, text in the bottom UI zone (vertical), long silences, clipping; writes `out/qa/sheet.png` (1 frame/second). It understands motion (ignores fade-ins, masks, transitions, fly-ins) and exits 1 on real problems. Fix everything it reports, then **look at the contact sheet** (bidi order, contrast, composition) — the script can't judge taste. Repeat until clean. Do it for each format you deliver.

### 7. Render & deliver
```bash
npx remotion render <Id>-Vertical out/video.mp4 --props=props.json --codec=h264 --crf=18
```
For browser uploads with a size cap (e.g. 10MB): `-vf scale=720:1280 -b:v 900k`. Report path, duration, size; offer other formats + thumbnail.

**Windows gotcha:** `chrome-headless-shell.exe ENOENT` although the file exists = path > 260 chars → `npx remotion browser ensure`, copy `chrome-headless-shell-win64` to a short path, pass `--browser-executable`. Remotion's bundled ffmpeg is minimal (no `fps`/`tile` filters) — use `-r` and Pillow, as `qa.py` does.

### 8. Publishing (only when the user asks)
Confirm title/description/visibility first. Declarations (YouTube "made for kids", AI-content labels) are the user's to make — ask per video. Never enter passwords, API keys or payment details; paid ads need the user to set up the ad account and approve every spend.

## Quality bar
- [ ] `qa.py` clean in every delivered format; contact sheet looked at.
- [ ] Creator content: passes the checklist in `references/human-style.md` (>60% real footage, no gradient blobs over footage, punches + marks, irregular rhythm, human-sounding voice).
- [ ] No linear motion (except drifts); staggered entrances (2–4 frames); ≥3 depth layers per scene.
- [ ] Motivated transitions (iris, wipe, slide, glitch cut) — not just crossfades.
- [ ] Big tight type, max 2 fonts, nothing off-screen or colliding.
- [ ] Every visual hit has a sound; narration always intelligible over music.
- [ ] CTA holds ≥1s; thumbnail readable at 120px wide.

## Don'ts
- No recreating other brands' logos/trademarks or real people's likeness unless they're the user's own assets. Talking *about* a game/product in a news video is fine; use your own visuals or the user's own footage.
- No linear tweens, default Arial, centered-everything-with-fade, walls of text, stretched images.
- Don't download copyrighted music; use `make_music.py`, the user's licensed tracks, or the platform's music library.
