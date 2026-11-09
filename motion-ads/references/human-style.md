# Human-made, not AI-made — the creator style

Viewers scroll past anything that "looks AI" in under a second. Generated motion graphics have tells.
This guide is about removing them. **Default to this style for creator content** (Shorts/TikToks for a
channel, gaming, reviews, news, vlogs). Keep the polished motion-graphics style for brand/product ads only.

## What screams "AI / template"
| Tell | Why it reads fake | Do instead |
|---|---|---|
| Drawn shapes only, no real footage | Nothing was *filmed or played* | **Footage first**: gameplay, screen recordings, photos, screenshots of the source (patch notes, tweets), the creator's face |
| Purple/teal gradient blobs + bokeh + sparkles | The #1 AI-video look | Background = the footage itself (or a blurred copy of it). Flat brand color only for title cards |
| Glassmorphism cards, glow on everything | Stock "futuristic" template | Hard-edged stickers with a white border, marker highlights, plain bold text |
| Everything centered, symmetrical, perfectly level | Machines love symmetry | Off-center text, 1–4° tilts, things overlapping the footage edge, asymmetric layouts |
| Every element springs in the same way | Uniform easing = generated | Vary it: some things *cut* in (no animation at all), some slam, some slide. Hard cuts are human |
| Even pacing, one new element every N frames | Metronome feel | Irregular rhythm: 0.7s, 2.4s, 1.1s… Cut on the *word*, hold on the payoff, pause before the punchline |
| Constant smooth zooms (Ken Burns on everything) | Screensaver | **Zoom punches** (instant 1.0→1.15 in 2–3 frames on emphasis words), then hold still |
| Same "ching/shimmer" on every hit | Over-sweetened | Fewer SFX, chosen: whoosh on cuts, thud/bass hit on reveals, record scratch on "but…", silence for drama |
| Flawless motion, zero camera feel | No operator | Subtle handheld drift (±3px, ±0.3°), one-frame flash or blur on cuts, a little grain |
| Monotone AI narration with even pauses | "AI voice" in one second | The creator's **own voice** (best), or TTS with emotion tags and lower stability, short sentences, real reactions |
| Perfect stock English phrasing translated | Uncanny copy | Write how the creator talks: slang, short, first person ("אחי, תקשיבו"), questions, opinions |
| Emoji confetti, 10 hashtags on screen | Spam template | At most one emoji/sticker per beat, used like a human would |

## The creator editing grammar
- **Hook in 1 second** with footage + a big caption; no logo intro, no title card first.
- **Jump cuts**: remove gaps in the voice; cut footage on the beat of the words.
- **Zoom punch** on the important word; **freeze frame** (+ white flash + record scratch + label) for "look at this".
- **Hand-drawn annotations** on the footage: a rough red circle around the thing, an arrow, a marker underline — drawn on in ~6 frames, slightly wobbly.
- **Screenshot proof**: show the source (patch note, tweet, shop page) as a tilted card with a white border sliding over the footage, highlight the key line with marker.
- **Stickers**: short labels like "NEW", "חינם?!", "1/700,000" in a tilted white-bordered box.
- **Captions**: creator style — heavy font, thick black outline, active word in yellow, 1–3 words at a time, slightly rotated per chunk, sitting in the lower-middle.
- **Speed**: speed-ramp boring footage (×1.5–2), slow down the highlight.
- **Ending**: a quick ask ("תכתבו בתגובות…", "עקבו לעוד") over footage — not a 3-second branded end card.

## Imperfection budget (keep it subtle)
- Handheld: on for footage scenes, amplitude 2–4px, rotation 0.2–0.4°.
- Tilts: text/stickers between −4° and 4°, never all the same.
- Timing jitter: don't quantize every event to the same offset; follow the voice.
- Grain: ≤4% opacity. No vignette + glow + bloom stacks.

## Voice
1. Best: the user records the voiceover (phone is fine) → `detect_pauses.py --words script.txt` for timings/captions.
2. TTS: ElevenLabs v3 with **stability 0.3–0.4** (more expressive), audio tags in the script like `[excited]`, `[laughs]`, `[whispers]`, `[sighs]`, ellipses for real pauses, and sentence lengths that vary. Tell the user to label AI voice when posting.
3. Put music low under the voice; real creators rarely have silence *and* rarely blast music.

## Footage sources (rights!)
The user's own gameplay recordings / replays (Fortnite: Replay mode, NVIDIA/AMD/Xbox Game Bar clips), their own screen recordings, their own photos and facecam, screenshots of official sources for commentary. Don't rip other creators' videos. Official trailers only short, with commentary, and only if the user accepts that risk.

## Checklist before render
- [ ] >60% of the runtime shows real footage/images, not generated shapes.
- [ ] No gradient-blob backgrounds in footage scenes; ≤1 sticker/emoji per beat.
- [ ] At least 2 zoom punches, 1 annotation, cuts aligned to words.
- [ ] Varied entrances (some hard cuts), irregular rhythm.
- [ ] Voice sounds like a person (own voice, or expressive TTS settings + tags).
