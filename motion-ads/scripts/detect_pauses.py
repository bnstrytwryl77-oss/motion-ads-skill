"""Finds the spoken phrases in a narration file so scenes can be timed to the voice.

Usage:
    python detect_pauses.py narration.mp3 [min_pause_seconds=0.22] [threshold=0.04]

Prints each phrase as "start-end" in seconds. Decodes with ffmpeg if it is on PATH,
otherwise with Remotion's bundled one (`npx remotion ffmpeg`, run inside a Remotion project).
Map the printed phrases to the script's sentences in order; longer pauses are usually
paragraph breaks.
"""
import array
import math
import os
import shutil
import subprocess
import sys
import tempfile
import wave


def decode(src: str, dst: str) -> None:
    args = ['-y', '-loglevel', 'error', '-i', src, '-c:a', 'pcm_s16le', '-ac', '1', '-ar', '8000', dst]
    if shutil.which('ffmpeg'):
        subprocess.run(['ffmpeg', *args], check=True)
    else:
        subprocess.run(' '.join(['npx', 'remotion', 'ffmpeg', *[f'"{a}"' for a in args]]), shell=True, check=True)


def phrases(path: str, min_pause: float, thr_ratio: float):
    w = wave.open(path)
    a = array.array('h', w.readframes(w.getnframes()))
    step = 80  # 10 ms at 8 kHz
    rms = [math.sqrt(sum(x * x for x in a[i:i + step]) / step) for i in range(0, len(a) - step, step)]
    thr = max(rms) * thr_ratio
    need = int(min_pause * 100)
    out, start, quiet, end = [], None, 0, 0
    for i, r in enumerate(rms):
        if r >= thr:
            if start is None:
                start = i
            quiet, end = 0, i
        elif start is not None:
            quiet += 1
            if quiet >= need:
                out.append((start / 100, (end + 1) / 100))
                start, quiet = None, 0
    if start is not None:
        out.append((start / 100, (end + 1) / 100))
    return out, len(rms) / 100


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    min_pause = float(sys.argv[2]) if len(sys.argv) > 2 else 0.22
    thr = float(sys.argv[3]) if len(sys.argv) > 3 else 0.04
    tmp = os.path.join(tempfile.mkdtemp(), 'vo.wav')
    decode(src, tmp)
    segs, total = phrases(tmp, min_pause, thr)
    print(f'length {total:.2f}s, {len(segs)} phrases')
    for s, e in segs:
        print(f'{s:.2f}-{e:.2f}')
