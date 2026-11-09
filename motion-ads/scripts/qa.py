"""One-command quality check for a Remotion composition. Run it inside the Remotion project.

    python qa.py <CompositionId> [--scale 0.4] [--props props.json] [--browser-executable PATH]

What it does:
 1. Renders a fast low-res preview (out/qa/preview.mp4) with verbose browser logs.
 2. Collects <QAGuard> warnings and reports text that stays OFF-SCREEN, OVERLAPS other text, or sits in the bottom
    UI zone for >= 10 consecutive frames (short entrance animations are ignored).
 3. Saves 1 frame/second to out/qa/frames/ and a contact sheet out/qa/sheet.png (needs Pillow).
    LOOK at it (bidi order, overlaps, contrast) before the final render.
 4. Checks the audio: peak level, clipping, and long silences.
Exit code 1 if overflow problems were found.
"""
import array
import math
import os
import re
import shutil
import subprocess
import sys
import wave
from collections import defaultdict


def sh(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf8', errors='replace')


def ffmpeg(args):
    exe = 'ffmpeg' if shutil.which('ffmpeg') else 'npx remotion ffmpeg'
    return sh(f'{exe} -y -loglevel error {args}')


def runs(frames, min_len=10):
    frames = sorted(set(frames))
    best, out, start, prev = 0, [], None, None
    for f in frames:
        if start is None or f != prev + 1:
            if start is not None and prev - start + 1 >= min_len:
                out.append((start, prev))
            start = f
        prev = f
    if start is not None and prev - start + 1 >= min_len:
        out.append((start, prev))
    return out


def audio_report(video):
    tmp = os.path.join('out', 'qa', 'audio.wav')
    r = ffmpeg(f'-i "{video}" -vn -c:a pcm_s16le -ac 1 -ar 8000 "{tmp}"')
    if not os.path.exists(tmp):
        return ['audio: no audio track (or decode failed)']
    w = wave.open(tmp)
    a = array.array('h', w.readframes(w.getnframes()))
    if not a:
        return ['audio: empty']
    peak = max(abs(x) for x in a)
    clip = sum(1 for x in a if abs(x) > 32000)
    msgs = [f'audio: peak {20 * math.log10(max(peak, 1) / 32768):.1f} dBFS, near-clipping samples: {clip}']
    if clip:
        msgs.append('  -> lower SFX/music volumes (clipping)')
    # silences longer than 1.5s (excluding the last second)
    step, quiet, longest, at = 80, 0, 0, 0
    for i in range(0, len(a) - 8000, step):
        rms = math.sqrt(sum(x * x for x in a[i:i + step]) / step)
        if rms < 150:
            quiet += 1
            if quiet > longest:
                longest, at = quiet, i
        else:
            quiet = 0
    if longest * 0.01 > 1.5:
        msgs.append(f'  -> {longest * 0.01:.1f}s of near-silence around {at / 8000:.1f}s (add music/SFX or tighten timing)')
    return msgs


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    comp = sys.argv[1]
    args = dict(zip(sys.argv[2::2], sys.argv[3::2]))
    scale = args.get('--scale', '0.4')
    be = f'--browser-executable="{args["--browser-executable"]}"' if '--browser-executable' in args else ''
    if '--props' in args:
        be += f' --props="{args["--props"]}"'
    os.makedirs(os.path.join('out', 'qa'), exist_ok=True)
    video = os.path.join('out', 'qa', 'preview.mp4')
    print(f'rendering preview of {comp} at scale {scale} ...')
    r = sh(f'npx remotion render {comp} "{video}" --scale={scale} --crf=30 --log=verbose {be}')
    log = r.stdout + r.stderr
    if r.returncode != 0:
        print(log[-3000:])
        sys.exit('render failed')
    hits = defaultdict(list)
    inside = defaultdict(set)
    for m in re.finditer(r'\[QA\] f=(\d+) (overflow|ui-zone|overlap|inside) "([^"]*)"([^\n]*)', log):
        f, kind, text = int(m.group(1)), m.group(2), m.group(3)
        if kind == 'inside':
            inside[text].add(f)
        else:
            hits[(kind, text)].append((f, m.group(4).split('", source')[0].strip()))
    problems = 0
    print('\n== layout ==')
    if not inside and not hits:
        print('no QA output — wrap the composition content in <QAGuard> (see templates/src/Root.tsx)')
    for (kind, text), lst in sorted(hits.items()):
        for s, e in runs([f for f, _ in lst]):
            # a fly-in: off-screen, then lands inside the frame right after -> not a bug
            if kind == 'overflow' and any(e + k in inside[text] for k in (1, 2, 3)):
                continue
            detail = next(d for f, d in lst if f == s)
            print(f'{kind:8} frames {s}-{e}: "{text}" {detail}')
            problems += kind in ('overflow', 'overlap')
    if (inside or hits) and not problems:
        print('OK: no lasting off-screen or overlapping text')
    # one frame per second, tiled into a contact sheet (Pillow) or left as separate PNGs
    frames_dir = os.path.join('out', 'qa', 'frames')
    shutil.rmtree(frames_dir, ignore_errors=True)
    os.makedirs(frames_dir)
    # (Remotion's bundled ffmpeg has no fps/tile filters, so use -r and tile with Pillow)
    ffmpeg(f'-i "{video}" -vf "scale=216:-1" -r 1 "{os.path.join(frames_dir, "%03d.png")}"')
    pics = sorted(os.listdir(frames_dir))
    sheet = os.path.join('out', 'qa', 'sheet.png')
    try:
        from PIL import Image
        ims = [Image.open(os.path.join(frames_dir, p)) for p in pics]
        cols = 8
        w, h = ims[0].size
        board = Image.new('RGB', (cols * (w + 4), math.ceil(len(ims) / cols) * (h + 4)), 'black')
        for i, im in enumerate(ims):
            board.paste(im, ((i % cols) * (w + 4), (i // cols) * (h + 4)))
        board.save(sheet)
        print(f'\n== contact sheet (look at it!) ==\n{sheet}  ({len(ims)} frames, 1 per second)')
    except Exception:
        print(f'\n== frames (look at them!) ==\n{frames_dir}  ({len(pics)} frames, 1 per second; pip install pillow for one sheet)')
    print('\n== audio ==')
    for msg in audio_report(video):
        print(msg)
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
