"""Synthesizes royalty-free sound effects (riser, boom, coin ching, shimmer, tick, pop, swoosh, buzz).
Pure Python, no dependencies. Usage: python make_sfx.py [output_dir]  (default: ./public/sfx)"""
import array
import math
import os
import random
import sys
import wave

SR = 44100
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.getcwd(), 'public', 'sfx')
os.makedirs(OUT, exist_ok=True)
random.seed(7)


def save(name, samples, gain=0.9):
    peak = max(1e-9, max(abs(s) for s in samples))
    data = array.array('h', (int(max(-1, min(1, s / peak * gain)) * 32767) for s in samples))
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(name, '%.2fs' % (len(samples) / SR))


def n(sec):
    return int(sec * SR)


def lowpass(x, cutoffs):
    y, out = 0.0, []
    for s, fc in zip(x, cutoffs):
        a = 1 - math.exp(-2 * math.pi * fc / SR)
        y += a * (s - y)
        out.append(y)
    return out


def riser(sec=0.9):
    N = n(sec)
    noise = [random.uniform(-1, 1) for _ in range(N)]
    cut = [300 * (8000 / 300) ** (i / N) for i in range(N)]
    nf = lowpass(noise, cut)
    out, ph = [], 0.0
    for i in range(N):
        t = i / N
        f = 180 * (1400 / 180) ** (t ** 1.5)
        ph += 2 * math.pi * f / SR
        env = t ** 2.2
        out.append(env * (0.8 * nf[i] * 2.5 + 0.35 * math.sin(ph) + 0.15 * math.sin(2.01 * ph)))
    return out


def boom(sec=1.4):
    N = n(sec)
    out, ph = [], 0.0
    for i in range(N):
        t = i / SR
        f = 35 + 110 * math.exp(-t * 9)
        ph += 2 * math.pi * f / SR
        body = math.sin(ph) * math.exp(-t * 3.2)
        click = random.uniform(-1, 1) * math.exp(-t * 60) * 0.6
        out.append(math.tanh(1.8 * body) + click)
    return out


def ching(sec=1.3, base=2093):
    N = n(sec)
    partials = [(1.0, 1.0, 5), (2.76, 0.6, 7), (5.4, 0.35, 9), (1.5, 0.4, 6), (8.93, 0.2, 12)]
    out = []
    for i in range(N):
        t = i / SR
        s = sum(a * math.sin(2 * math.pi * base * r * t + 0.3 * math.sin(2 * math.pi * 6 * t)) * math.exp(-t * d)
                for r, a, d in partials)
        s *= min(1, t * 2000)
        out.append(s)
    return out


def shimmer(sec=1.5, grains=38):
    N = n(sec)
    out = [0.0] * N
    for _ in range(grains):
        start = int(random.random() ** 1.4 * (N - n(0.25)))
        f = random.uniform(3200, 8200)
        amp = random.uniform(0.3, 1)
        L = n(random.uniform(0.08, 0.22))
        for j in range(L):
            t = j / SR
            out[start + j] += amp * math.sin(2 * math.pi * f * t) * math.exp(-t * 28) * min(1, t * 3000)
    return out


def tick(sec=0.04, f=2600):
    return [math.sin(2 * math.pi * f * i / SR) * math.exp(-i / SR * 140) for i in range(n(sec))]


def pop(sec=0.16):
    out, ph = [], 0.0
    for i in range(n(sec)):
        t = i / SR
        ph += 2 * math.pi * (180 + 700 * math.exp(-t * 40)) / SR
        out.append(math.sin(ph) * math.exp(-t * 26) * min(1, t * 4000))
    return out


def swoosh(sec=0.5):
    N = n(sec)
    noise = [random.uniform(-1, 1) for _ in range(N)]
    cut = [6000 * (400 / 6000) ** (i / N) for i in range(N)]
    nf = lowpass(noise, cut)
    return [nf[i] * math.sin(math.pi * (i / N) ** 0.6) ** 2 for i in range(N)]


def buzz(sec=0.2, f=110):
    out = []
    for i in range(n(sec)):
        t = i / SR
        sq = 1 if math.sin(2 * math.pi * f * t) > 0 else -1
        sq2 = 1 if math.sin(2 * math.pi * f * 1.5 * t) > 0 else -1
        out.append((0.6 * sq + 0.4 * sq2) * min(1, t * 800) * min(1, (sec - t) * 60))
    return lowpass(out, [3000] * len(out))


save('riser.wav', riser(), 0.8)
save('boom.wav', boom(), 0.95)
save('ching.wav', ching(), 0.8)
save('ching-low.wav', ching(base=1568), 0.8)
save('shimmer.wav', shimmer(), 0.7)
save('tick.wav', tick(), 0.7)
save('pop.wav', pop(), 0.85)
save('swoosh.wav', swoosh(), 0.8)
save('buzz.wav', buzz(), 0.6)
