"""Finds the spoken phrases in a narration file so scenes can be timed to the voice.

Usage:
    python detect_pauses.py narration.mp3 [min_pause_seconds=0.22] [threshold=0.04] [--words SCRIPT.txt]

With --words, also writes narration.words.json with ESTIMATED per-word timings (words are
spread over the detected speech in proportion to their length, never across a pause) and
narration.phrases.json — good enough for word-by-word captions when the TTS gave no alignment.

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


def estimate_words(segs, text):
    """Spread the script's words over speech time (pauses excluded), proportional to length."""
    import json  # noqa
    words = [w for w in text.split() if not (w.startswith('[') and w.endswith(']'))]  # skip [audio tags]
    total_speech = sum(e - s for s, e in segs)
    weights = [len(w) + 1.5 for w in words]
    scale = total_speech / sum(weights)
    out, si, t = [], 0, segs[0][0]
    for w, wt in zip(words, weights):
        d = wt * scale
        # move to the next phrase if this word would mostly fall into a pause
        while si < len(segs) - 1 and t + d / 2 > segs[si][1]:
            si += 1
            t = max(t, segs[si][0])
        out.append({'word': w, 'start': round(t, 3), 'end': round(min(t + d, segs[si][1]), 3)})
        t += d
    return out


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    argv = sys.argv[1:]
    words_src = None
    if '--words' in argv:
        k = argv.index('--words')
        words_src = argv[k + 1]
        argv = argv[:k] + argv[k + 2:]
    src = argv[0]
    min_pause = float(argv[1]) if len(argv) > 1 else 0.22
    thr = float(argv[2]) if len(argv) > 2 else 0.04
    tmp = os.path.join(tempfile.mkdtemp(), 'vo.wav')
    decode(src, tmp)
    segs, total = phrases(tmp, min_pause, thr)
    print(f'length {total:.2f}s, {len(segs)} phrases')
    for s, e in segs:
        print(f'{s:.2f}-{e:.2f}')
    if words_src:
        import json
        words = estimate_words(segs, open(words_src, encoding='utf8').read())
        base = src.rsplit('.', 1)[0]
        json.dump(words, open(base + '.words.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
        json.dump([{'start': s, 'end': e} for s, e in segs], open(base + '.phrases.json', 'w', encoding='utf8'), indent=1)
        print(f'wrote {base}.words.json ({len(words)} words, estimated) and {base}.phrases.json')
