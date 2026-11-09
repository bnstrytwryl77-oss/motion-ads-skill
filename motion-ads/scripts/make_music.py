"""Royalty-free background music generator (pure Python, no dependencies).

Makes a loopable beat that fits ads/Shorts and a beat map so cuts can land on the beat.

Usage:
    python make_music.py OUT.wav [--seconds 30] [--bpm 120] [--mood energetic|dark|chill|epic] [--key A]

Writes OUT.wav (44.1 kHz mono, peak about -6 dBFS so it sits under narration)
and OUT.beats.json: {"bpm", "seconds", "beats": [...seconds], "bars": [...seconds]}.
At 30 fps one beat = 1800 / bpm frames (120 bpm -> 15 frames).
"""
import array
import json
import math
import random
import sys
import wave

SR = 44100
NOTES = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
MOODS = {
    # chord roots in semitones from the key (minor-ish progressions), drum density, pad brightness
    'energetic': {'prog': [0, 8, 3, 10], 'hats': 16, 'four_floor': True, 'bright': 0.9},
    'dark': {'prog': [0, 0, 8, 7], 'hats': 8, 'four_floor': False, 'bright': 0.4},
    'chill': {'prog': [0, 5, 8, 3], 'hats': 8, 'four_floor': False, 'bright': 0.5},
    'epic': {'prog': [0, 8, 3, 10], 'hats': 8, 'four_floor': True, 'bright': 0.7},
}


def freq(semi_from_a4: float) -> float:
    return 440.0 * 2 ** (semi_from_a4 / 12)


def add(buf, start, samples, gain=1.0):
    for i, s in enumerate(samples):
        j = start + i
        if j >= len(buf):
            break
        buf[j] += s * gain


def kick():
    out, ph = [], 0.0
    for i in range(int(0.35 * SR)):
        t = i / SR
        ph += 2 * math.pi * (45 + 120 * math.exp(-t * 30)) / SR
        out.append(math.sin(ph) * math.exp(-t * 9))
    return out


def snare():
    rnd = random.Random(1)
    return [(0.7 * rnd.uniform(-1, 1) + 0.3 * math.sin(2 * math.pi * 190 * i / SR)) * math.exp(-i / SR * 22) for i in range(int(0.25 * SR))]


def hat(open_=False):
    rnd = random.Random(2)
    d = 12 if open_ else 60
    prev, out = 0.0, []
    for i in range(int((0.18 if open_ else 0.05) * SR)):
        n = rnd.uniform(-1, 1)
        out.append((n - prev) * math.exp(-i / SR * d))  # crude high-pass
        prev = n
    return out


def bass(f, dur):
    out = []
    for i in range(int(dur * SR)):
        t = i / SR
        saw = sum(math.sin(2 * math.pi * f * k * t) / k for k in range(1, 6))
        env = min(1, t * 200) * math.exp(-t * 2.5)
        out.append(math.tanh(1.5 * saw) * env)
    return out


def pad(freqs, dur, bright):
    out = []
    n = int(dur * SR)
    harm = 2 + int(bright * 4)
    for i in range(n):
        t = i / SR
        env = min(1, t * 3) * min(1, (dur - t) * 3)
        s = 0.0
        for f in freqs:
            for k in range(1, harm + 1):
                s += math.sin(2 * math.pi * f * k * t * (1 + 0.002 * (k % 2))) / (k * k)
        out.append(s * env / len(freqs))
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    out_path = sys.argv[1]
    args = dict(zip(sys.argv[2::2], sys.argv[3::2]))
    bpm = float(args.get('--bpm', 120))
    seconds = float(args.get('--seconds', 30))
    mood = MOODS[args.get('--mood', 'energetic')]
    key = NOTES[args.get('--key', 'A').upper()] - 9  # semitones from A

    beat = 60 / bpm
    bar = beat * 4
    n_bars = math.ceil(seconds / bar)
    buf = [0.0] * int(n_bars * bar * SR + SR)
    K, S, H, HO = kick(), snare(), hat(), hat(True)

    for b in range(n_bars):
        t0 = b * bar
        root = key + mood['prog'][b % len(mood['prog'])]
        intro = b == 0
        # drums
        for q in range(4):
            tq = int((t0 + q * beat) * SR)
            if mood['four_floor'] or q in (0, 2):
                add(buf, tq, K, 0.9)
            if q in (1, 3) and not intro:
                add(buf, tq, S, 0.35)
        if not intro:
            steps = mood['hats']
            for s in range(steps):
                add(buf, int((t0 + s * bar / steps) * SR), HO if s % (steps // 2) == steps // 2 - 1 else H, 0.12 if s % 2 else 0.18)
        # bass on eighths following the chord root
        for e in range(8):
            if e in (0, 3, 4, 6):
                add(buf, int((t0 + e * beat / 2) * SR), bass(freq(root - 24), beat / 2 * 0.9), 0.32)
        # pad chord (minor triad)
        add(buf, int(t0 * SR), pad([freq(root - 12), freq(root - 9), freq(root - 5)], bar, mood['bright']), 0.22)

    total = int(seconds * SR)
    buf = buf[:total]
    # fade in/out
    for i in range(min(int(0.3 * SR), total)):
        buf[i] *= i / (0.3 * SR)
    for i in range(min(int(1.5 * SR), total)):
        buf[total - 1 - i] *= i / (1.5 * SR)
    peak = max(1e-9, max(abs(x) for x in buf))
    g = 0.5 / peak  # about -6 dBFS
    data = array.array('h', (int(max(-1, min(1, math.tanh(x * g * 1.2) / math.tanh(1.2))) * 32767) for x in buf))
    with wave.open(out_path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())

    beats = [round(i * beat, 3) for i in range(int(seconds / beat) + 1)]
    bars = [round(i * bar, 3) for i in range(int(seconds / bar) + 1)]
    with open(out_path.rsplit('.', 1)[0] + '.beats.json', 'w') as f:
        json.dump({'bpm': bpm, 'seconds': seconds, 'beats': beats, 'bars': bars}, f)
    print(f'{out_path}: {seconds:.1f}s @ {bpm:g} bpm, {len(beats)} beats; 1 beat = {1800 / bpm:.1f} frames at 30fps')


if __name__ == '__main__':
    main()
