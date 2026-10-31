#!/usr/bin/env python3
"""The soundtrack of "A day at GALIL", the second commercial: calm, serious, cinematic.
Piano, a string section, a ticking-clock pulse (the film follows one working day), a low synth
pulse, soft drums and deep hits. Original and generated, so there is nothing to license.

    python3 music-day.py <out.wav>

90 bpm in D minor — a beat is 2/3 s, a bar 8/3 s. The form, in bars:
  0–3   piano alone, the clock ticking
  4–5   the title: a swell and the first deep hit
  6–13  the morning: the synth pulse and the strings come in
  14–19 midday: soft drums, the piano in eighths
  20–21 a pause: piano and a swell (Model Studio)
  22–29 the afternoon: the hit, the strings take the melody an octave up
  30–31 evening: down to piano and pad
  32–35 the end: the last hit, one chord ringing out
Needs numpy.
"""
import sys, wave
import numpy as np

SR = 44100
BPM = 90
BEAT = 60 / BPM
BAR = 4 * BEAT
TOTAL = 36 * BAR + 1.0
N = int(SR * TOTAL)
rng = np.random.default_rng(23)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def bt(bar, beat=0.0): return bar * BAR + beat * BEAT

class Bus:
    def __init__(self): self.L = np.zeros(N); self.R = np.zeros(N)
    def add(self, sig, t, pan=0.0, gain=1.0):
        i = int(round(t * SR))
        if i >= N: return
        sig = sig[: N - i] * gain
        self.L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2) * 1.414
        self.R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2) * 1.414

def fft_filter(x, fn):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * fn(f), len(x))
def lp(f, fc, o=2): return 1 / np.sqrt(1 + (f / fc) ** (2 * o))
def hp(f, fc, o=2): return 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * o))
def peak(f, fc, db, q=1.0): g = 10 ** (db / 20); return 1 + (g - 1) * np.exp(-0.5 * (np.log2(np.maximum(f, 1) / fc) * q * 2.2) ** 2)

def reverb(x, secs, seed, damp=6000, pre=0.02):
    n = int(SR * secs); r = np.random.default_rng(seed); t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-t * 6.9 / secs); ir[: int(SR * pre)] = 0
    ir = fft_filter(ir, lambda f: lp(f, damp, 1) * hp(f, 150, 1)); ir /= np.sqrt(np.sum(ir ** 2))
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]

# ---------------------------------------------------------------- instruments
def piano(m, dur=None, vel=1.0):
    """a piano note: slightly stretched partials, each decaying faster than the one below"""
    f = hz(m); length = min(6.0, 2.5 + (72 - m) * 0.06) if dur is None else dur
    n = int(SR * length); t = np.arange(n) / SR
    s = np.zeros(n)
    for k in range(1, 14):
        fk = k * f * np.sqrt(1 + 0.00035 * k * k)
        if fk > 12000: break
        a = (1 / k ** 1.25) * (0.6 + 0.4 * vel) ** (k * 0.3)
        s += a * np.sin(2 * np.pi * fk * t + k) * np.exp(-t * (0.55 + 0.35 * k) * (1 + (m - 60) / 60))
    hammer = rng.standard_normal(n) * np.exp(-t * 300) * 0.04
    env = np.minimum(1, t / 0.003) * np.clip((length - t) / 0.3, 0, 1)
    return (s + hammer) * env * vel

def strings(m, dur, att=1.2, rel=1.5):
    n = int(SR * (dur + rel)); t = np.arange(n) / SR
    f = hz(m); s = np.zeros(n)
    for v in range(5):
        det = 1 + (v - 2) * 0.0028
        ph = 2 * np.pi * f * det * t + 0.004 * np.sin(2 * np.pi * (5.0 + v * .3) * t) * 2 * np.pi + rng.uniform(0, 6)
        for k in range(1, 12):
            if f * k > 7000: break
            s += np.sin(k * ph) / k * (0.8 ** k)
    env = np.minimum(1, t / att) * np.where(t < dur, 1, np.exp(-(t - dur) / (rel / 3)))
    return s * env / 5

def pulse(m, dur):
    n = int(SR * (dur + 0.05)); t = np.arange(n) / SR; f = hz(m)
    s = sum(np.sin(2 * np.pi * f * k * t) / k * (0.75 ** k) for k in range(1, 9))
    env = np.minimum(1, t / 0.004) * np.exp(-t * 7) * np.clip((dur + .05 - t) / .05, 0, 1)
    return s * env

def tick(high):
    n = int(SR * 0.05); t = np.arange(n) / SR
    f = 2900 if high else 2300
    return (np.sin(2 * np.pi * f * t) * 0.6 + rng.standard_normal(n) * 0.4) * np.exp(-t * 160)

def kick():
    n = int(SR * 0.5); t = np.arange(n) / SR
    f = 42 + 80 * np.exp(-t * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + rng.standard_normal(n) * np.exp(-t * 300) * 0.25

def snap():
    n = int(SR * 0.25); t = np.arange(n) / SR
    nz = rng.standard_normal(n); nz = nz - np.convolve(nz, np.ones(5) / 5, "same")
    return nz * np.exp(-t * 35) + np.sin(2 * np.pi * 900 * t) * np.exp(-t * 60) * .3

def shaker():
    n = int(SR * 0.08); t = np.arange(n) / SR
    nz = rng.standard_normal(n); nz = nz - np.convolve(nz, np.ones(2) / 2, "same")
    return nz * np.minimum(1, t / 0.01) * np.exp(-t * 50)

def hit(secs=4.0):
    """a deep cinematic hit: a low drum, a sub drop and a burst of air"""
    n = int(SR * secs); t = np.arange(n) / SR
    f = 38 + 60 * np.exp(-t * 8)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.3)
    skin = np.sin(2 * np.pi * np.cumsum(90 + 60 * np.exp(-t * 20)) / SR) * np.exp(-t * 5) * 0.6
    air = np.convolve(rng.standard_normal(n), np.ones(12) / 12, "same") * np.exp(-t * 3) * 1.2
    return np.tanh((body + skin + air) * 1.3)

def swell(secs):
    n = int(SR * secs); t = np.arange(n) / SR
    nz = np.convolve(rng.standard_normal(n), np.ones(6) / 6, "same")
    return nz * (t / secs) ** 3 * 0.8

# ---------------------------------------------------------------- the score
pno, strg, pul, perc, fx = Bus(), Bus(), Bus(), Bus(), Bus()
D = 50  # D3
# Dm – Bb – F – C, one bar each
CH = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]
ROOT = [38, 34, 41, 36]

def piano_bar(bar, i, style, gain=1.0):
    c = CH[i % 4]
    pno.add(piano(ROOT[i % 4] + 12, vel=.7), bt(bar), pan=-0.2, gain=0.30 * gain)    # the left hand
    if style == "sparse":
        notes = [(0, c[0] + 12), (1, c[2] + 12), (2, c[1] + 24), (3, c[2] + 12)]
    elif style == "eighths":
        seq = [c[0] + 12, c[2] + 12, c[1] + 24, c[2] + 12, c[0] + 24, c[2] + 12, c[1] + 24, c[2] + 12]
        notes = [(k * .5, m) for k, m in enumerate(seq)]
    else:  # chord
        notes = [(0, c[0] + 12), (0.02, c[1] + 12), (0.04, c[2] + 12)]
    for x, m in notes:
        pno.add(piano(m, vel=.55 + .2 * (x % 1 == 0)), bt(bar, x), pan=(m - 66) / 30, gain=0.22 * gain)

def strings_bar(bar, i, octave=0, gain=1.0):
    c = CH[i % 4]
    for j, m in enumerate(c):
        strg.add(strings(m + octave, BAR * 0.98, att=1.0, rel=1.4), bt(bar), pan=(-0.6, 0, 0.6)[j], gain=0.10 * gain)
    strg.add(strings(ROOT[i % 4], BAR * 0.98), bt(bar), gain=0.06 * gain)

def pulse_bar(bar, i, gain=1.0):
    for k in range(8): pul.add(pulse(ROOT[i % 4] + 12, BEAT * .45), bt(bar, k * .5), gain=(0.22 if k % 2 == 0 else 0.15) * gain)

def ticks(bar, gain=1.0):
    for k in range(8): perc.add(tick(k % 2 == 0), bt(bar, k * .5), pan=0.5, gain=0.06 * gain)

def drums(bar, full=False):
    perc.add(kick(), bt(bar), gain=0.5); perc.add(kick(), bt(bar, 2.5 if full else 2), gain=0.35 if full else 0.3)
    perc.add(snap(), bt(bar, 2), pan=-0.1, gain=0.22 if not full else 0.3)
    for k in range(16): perc.add(shaker(), bt(bar, k * .25), pan=0.3, gain=(0.05 if k % 2 else 0.03) * (1.3 if full else 1))

MELODY = [[(0, 81, 2), (2, 86, 2)], [(0, 77, 3), (3, 74, 1)], [(0, 84, 2), (2, 81, 2)], [(0, 79, 4)]]

# 0–3: piano alone, the clock
for b in range(4): piano_bar(b, b, "sparse"); ticks(b, 0.6 + b * .1)
fx.add(swell(BAR * 2), bt(2), gain=0.25)
# 4–5: the title
fx.add(hit(5), bt(4), gain=0.55)
for b in (4, 5): piano_bar(b, b, "chord", 1.7); strings_bar(b, b, 12, 0.8); ticks(b, .8)
# 6–13: morning
for b in range(6, 14): piano_bar(b, b, "sparse"); strings_bar(b, b, 0, .8 + (b - 6) * .04); pulse_bar(b, b, .7 + (b - 6) * .05); ticks(b)
fx.add(swell(BAR), bt(13), gain=0.3)
# 14–19: midday
for b in range(14, 20): piano_bar(b, b, "eighths"); strings_bar(b, b, 0, 1.1); pulse_bar(b, b); ticks(b, .8); drums(b)
fx.add(hit(3), bt(14), gain=0.3)
# 20–21: the pause
for b in (20, 21): piano_bar(b, b, "sparse", 1.1); strings_bar(b, b, 12, 0.5)
fx.add(swell(BAR * 2), bt(20), gain=0.5)
# 22–29: afternoon — the melody on strings, an octave up
fx.add(hit(5), bt(22), gain=0.7)
for b in range(22, 30):
    piano_bar(b, b, "eighths", 1.0); strings_bar(b, b, 0, 1.3); strings_bar(b, b, 12, 0.6); pulse_bar(b, b, 1.1); ticks(b, .7); drums(b, full=True)
    for (x, m, l) in MELODY[(b - 22) % 4]:
        strg.add(strings(m - 12, l * BEAT, att=.35, rel=1.2), bt(b, x), pan=0.15, gain=0.16)
        pno.add(piano(m, vel=.8), bt(b, x), pan=.25, gain=0.20)
fx.add(hit(3), bt(26), gain=0.4)
fx.add(swell(BAR), bt(29), gain=0.35)
# 30–31: evening
for b in (30, 31): piano_bar(b, b, "sparse", .9); strings_bar(b, b, 0, .7); ticks(b, .5 - (b - 30) * .2)
# 32–35: the end
fx.add(hit(6), bt(32), gain=0.75)
for j, m in enumerate([38, 50, 53, 57, 62, 65, 69]):
    pno.add(piano(m, dur=7, vel=.85), bt(32) + j * 0.03, pan=(m - 55) / 30, gain=0.25)
    strg.add(strings(m, BAR * 2.5, att=.8, rel=3), bt(32), pan=(m - 55) / 30, gain=0.09)
pno.add(piano(81, dur=6, vel=.6), bt(34), pan=.3, gain=0.2)

# ---------------------------------------------------------------- the mix (made to carry on small speakers too)
def sf(bus, fn): bus.L = fft_filter(bus.L, fn); bus.R = fft_filter(bus.R, fn)
sf(pno, lambda f: hp(f, 70) * peak(f, 2500, 2))
sf(strg, lambda f: hp(f, 60) * lp(f, 6000, 2) * peak(f, 1200, 2))
sf(pul, lambda f: hp(f, 50) * lp(f, 2200, 2) * peak(f, 700, 4))
sf(perc, lambda f: hp(f, 40) * peak(f, 3000, 2))
sf(fx, lambda f: hp(f, 30) * lp(f, 8000, 1))

hall = lambda b, s: (reverb(b.L, 3.6, s, 5500), reverb(b.R, 3.6, s + 1, 5500))
pL, pR = hall(pno, 1); sL, sR = hall(strg, 3); fL, fR = hall(fx, 5)
cL = reverb(perc.L, 1.4, 7, 6000); cR = reverb(perc.R, 1.4, 8, 6000)
L = pno.L + pL * .45 + strg.L + sL * .5 + pul.L + perc.L + cL * .25 + fx.L + fL * .3
R = pno.R + pR * .45 + strg.R + sR * .5 + pul.R + perc.R + cR * .25 + fx.R + fR * .3
L = fft_filter(L, lambda f: hp(f, 35, 2)); R = fft_filter(R, lambda f: hp(f, 35, 2))

# gentle compression: block envelope, 3:1 above the threshold
blk = int(SR * .01); a = np.maximum(np.abs(L), np.abs(R)); nb = len(a) // blk + 1
pk = np.pad(a, (0, nb * blk - len(a))).reshape(nb, blk).max(1); env = np.zeros(nb); e = 0
for i, p in enumerate(pk): e = .5 * e + .5 * p if p > e else .985 * e + .015 * p; env[i] = e
env = np.repeat(env, blk)[: len(a)]; env /= env.max(); thr = .3
g = np.where(env > thr, (thr + (env - thr) / 3) / np.maximum(env, 1e-9), 1.0)
L *= g; R *= g
m = max(np.abs(L).max(), np.abs(R).max()); L = np.tanh(L / m * 1.3); R = np.tanh(R / m * 1.3)
fade = int(SR * 2.5); L[-fade:] *= np.linspace(1, 0, fade) ** 2; R[-fade:] *= np.linspace(1, 0, fade) ** 2
m = max(np.abs(L).max(), np.abs(R).max()) / 0.89
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.stack([L / m, R / m], 1) * 32767).astype(np.int16).tobytes())
print("wrote", sys.argv[1], "·", round(TOTAL, 1), "s")
