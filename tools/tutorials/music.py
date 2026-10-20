#!/usr/bin/env python3
"""Background music for the tutorial films: a calm, original piano-and-pad loop.

    python3 music.py <seconds> <out.wav> [seed]

Chords I–vi–IV–V in C at 72 bpm: a soft pad, a low bass note on each bar, a
gentle bell arpeggio and a touch of reverb. Generated, so there is nothing to
license. The film mixes it in quietly under the captions.
"""
import sys, wave
import numpy as np

SR = 44100
secs = float(sys.argv[1]); out = sys.argv[2]
rng = np.random.default_rng(int(sys.argv[3]) if len(sys.argv) > 3 else 7)
N = int(SR * (secs + 4))
L = np.zeros(N); R = np.zeros(N)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
BEAT = 60 / 72; BAR = 4 * BEAT; CH = 2 * BAR
# voicings, MIDI numbers: Cmaj9, Am9, Fmaj7(9), G6sus → G
CHORDS = [[48, 55, 64, 71, 74], [45, 52, 60, 67, 71], [41, 48, 57, 64, 67], [43, 50, 59, 62, 69]]
ARP = [[72, 76, 79, 83, 79, 76, 74, 76], [69, 72, 76, 79, 76, 72, 71, 72], [65, 69, 72, 76, 72, 69, 67, 69], [67, 71, 74, 79, 74, 71, 69, 71]]

def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * (1 - pan) * 0.5 * 2 ** 0.5
    R[i:i + len(sig)] += sig * (1 + pan) * 0.5 * 2 ** 0.5

def pad(f, dur):
    t = np.arange(int(SR * (dur + 2.5))) / SR
    env = np.minimum(1, t / 1.6) * np.where(t < dur, 1, np.exp(-(t - dur) / 0.9))
    s = sum(np.sin(2 * np.pi * f * d * t + rng.uniform(0, 6.28)) for d in (0.9983, 1.0, 1.0017))
    s += 0.18 * np.sin(2 * np.pi * 2 * f * t) + 0.06 * np.sin(2 * np.pi * 3 * f * t)
    return s * env * (0.5 + 0.08 * np.sin(2 * np.pi * 0.17 * t))

def bell(f, dur=2.2):
    t = np.arange(int(SR * dur)) / SR
    env = np.minimum(1, t / 0.006) * np.exp(-t * 2.6)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 4) + 0.08 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 6)) * env

def bass(f, dur):
    t = np.arange(int(SR * (dur + 1))) / SR
    env = np.minimum(1, t / 0.05) * np.exp(-t * 0.7)
    return (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 2 * f * t)) * env

t0 = 0.0; k = 0
while t0 < secs + 2:
    ch = CHORDS[k % 4]
    for j, m in enumerate(ch): add(pad(hz(m), CH), t0, pan=(j - 2) * 0.18, gain=0.055)
    for b in range(2): add(bass(hz(ch[0] - 12), BAR), t0 + b * BAR, gain=0.16)
    if k >= 1:                                     # the arpeggio comes in after the first chord
        for i, m in enumerate(ARP[k % 4] * 2):
            if rng.random() < 0.12: continue           # a few rests, so it breathes
            add(bell(hz(m)), t0 + i * BEAT / 2, pan=rng.uniform(-0.35, 0.35), gain=0.075 * rng.uniform(0.65, 1.0))
    t0 += CH; k += 1

# reverb: a 2.6 s decaying noise tail, different per side
def verb(x, seed):
    r = np.random.default_rng(seed); n = int(SR * 2.6)
    ir = r.standard_normal(n) * np.exp(-np.arange(n) / SR * 2.4); ir /= np.sqrt((ir ** 2).sum())
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
L, R = L + 0.32 * verb(L, 1), R + 0.32 * verb(R, 2)

n = int(SR * secs); L, R = L[:n], R[:n]
fade = np.ones(n); fi, fo = int(SR * 2.5), int(SR * 5)
fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max()) or 1
st = (np.stack([L, R], 1) / peak * 0.89 * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
