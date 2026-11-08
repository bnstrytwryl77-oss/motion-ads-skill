# Motion principles — After Effects techniques in Remotion

## Core APIs
```tsx
import {AbsoluteFill, Sequence, Series, useCurrentFrame, useVideoConfig, interpolate, spring, Easing, Img, staticFile, Audio} from 'remotion';
const frame = useCurrentFrame();           // local to the enclosing <Sequence>
const {fps, width, height, durationInFrames} = useVideoConfig();
```
Always pass `{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}` to `interpolate` unless you want overshoot.

## Easing = the whole look
AE's "Easy Ease" + graph editor is what makes things feel expensive. Use these in `theme.ts`:
```ts
export const ease = {
  out:    Easing.bezier(0.16, 1, 0.3, 1),     // expo-out: entrances (the AE "snappy" look)
  in:     Easing.bezier(0.7, 0, 0.84, 0),     // expo-in: exits
  inOut:  Easing.bezier(0.83, 0, 0.17, 1),    // camera moves, wipes
  back:   Easing.bezier(0.34, 1.56, 0.64, 1), // slight overshoot for pops
};
```
Springs for physical feel:
```ts
spring({frame: frame - delay, fps, config: {damping: 200}})            // smooth, no bounce
spring({frame: frame - delay, fps, config: {damping: 12, stiffness: 120}}) // bouncy pop
spring({frame: frame - delay, fps, config: {mass: 0.6, damping: 15}})   // quick snappy
```
Rule: entrance fast-in-slow-settle (ease.out), exit slow-start-fast-leave (ease.in). Don't mix more than 2 curve families in one ad.

## Timing (30fps)
- Micro pop / UI element: 8–12 frames
- Text line entrance: 12–20 frames
- Scene transition: 10–20 frames
- Stagger between letters: 1–2 frames; words: 3–4; list items: 5–8
- Hold readable text: ≥30 frames
- Energetic ad: new visual event every 15–20 frames. Premium/luxury: slower, 30–45 frames, more drift.

## AE technique → Remotion recipe

| AE technique | Remotion |
|---|---|
| Position/scale/rotation keyframes | `interpolate(frame,[a,b],[from,to],{easing})` → `transform` |
| Overshoot / bounce | `spring` with low damping, or `ease.back` |
| Track matte / mask reveal | parent `overflow: hidden` + child translateY(100%→0); or `clipPath: inset(0 ${100-p}% 0 0)`; or `clipPath: circle(${r}% at 50% 50%)` |
| Trim paths (line drawing) | `@remotion/paths` `evolvePath(progress, d)` → `strokeDasharray/strokeDashoffset` |
| Text animator per character | split string, map with index-based delay |
| Motion blur | `@remotion/motion-blur` `<CameraMotionBlur shutterAngle={180} samples={6}>` (costly; use on fast moves only) or `<Trail>` |
| Directional blur on fast slide | `filter: blur(${velocity}px)` driven by interpolation peaking mid-move |
| 3D layers + camera | CSS `perspective: 1200px` on parent, `transform: rotateX/rotateY/translateZ` on children, `transformStyle: 'preserve-3d'` |
| Parallax | same camera offset × depth factor per layer (bg 0.2, mid 0.5, fg 1.0) |
| Wiggle expression | `noise2D('seed', frame*0.02, 0) * amp` from `@remotion/noise` |
| Light sweep / glint | gradient strip `linear-gradient(105deg, transparent 40%, rgba(255,255,255,.5) 50%, transparent 60%)` with animated `backgroundPosition`, `mixBlendMode: 'overlay'`, clipped to the object |
| Glow | stacked `filter: drop-shadow(0 0 20px color)` or `textShadow` |
| Gradient backgrounds that move | animate gradient angle / radial positions with noise |
| Grain / film texture | SVG `feTurbulence` overlay at 5–8% opacity, change `seed` each frame |
| Vignette | radial-gradient overlay transparent→rgba(0,0,0,.5) |
| Shape layers | `@remotion/shapes` (Circle, Rect, Star, Triangle) or SVG |
| Precomps | React components inside `<Sequence from durationInFrames>` |
| Scene transitions | `@remotion/transitions`: `TransitionSeries` + `slide`, `wipe`, `fade`, `flip`, `clockWipe`, custom presentation |
| Time remap / speed ramp | feed a remapped frame: `const t = interpolate(frame,[0,20,40],[0,35,40])` and drive everything by `t` |
| Camera shake on impact | 6–10 frame noise offset decaying to 0 |
| Fit text to box | `@remotion/layout-utils` `fitText({text, withinWidth, fontFamily, fontWeight})` |

## Composition & look
- Grid: 12-col mental grid, generous margins. Align to edges, not just center.
- Hierarchy: one hero element per moment. Big display (120–220px on 1080 wide) + small label (32–44px).
- Color: dark rich backgrounds (not pure #000) make colors pop; or bold brand-color flood. Accent used only for emphasis/CTA.
- Depth: background gradient + blurred shapes (`filter: blur(80px)`), mid objects with soft shadows (`0 30px 80px rgba(0,0,0,.35)`), foreground text.
- Always add subtle continuous motion: slow scale 1→1.05 over the scene ("Ken Burns"), drifting particles, rotating gradient.
- Match cuts: end scene A with a shape that becomes scene B's background (circle expands to fill → next scene).

## Performance
- Prefer CSS transforms/opacity; avoid huge blur values on many layers.
- Motion blur and noise grain multiply render time — apply selectively.
- Use `--concurrency` default; for long renders tell the user it may take a few minutes and run in background.
