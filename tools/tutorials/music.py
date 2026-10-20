#!/usr/bin/env python3
"""Background music for the tutorial films: a calm, original piano-and-pad loop.

    python3 music.py <seconds> <out.wav> [seed] [style]

style "bright" (the default): an upbeat, light track at 104 bpm in D — plucked
electric-piano chords on an off-beat rhythm, a round bass, soft kick, snap and
shaker, and a short bell motif.
style "calm": chords I–vi–IV–V in C at 72 bpm, a soft pad and a gentle bell arpeggio.
Generated, so there is nothing to license. The film mixes it in quietly under the captions.
"""
import sys, wave
import numpy as np

SR = 44100
secs = float(sys.argv[1]); out = sys.argv[2]
rng = np.random.default_rng(int(sys.argv[3]) if len(sys.argv) > 3 else 7)
STYLE = sys.argv[4] if len(sys.argv) > 4 else "bright"
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

def pluck(f, dur=0.5):
    """an electric-piano pluck: a few harmonics, a quick bright attack, a short tail"""
    t = np.arange(int(SR * dur)) / SR
    env = np.minimum(1, t / 0.004) * np.exp(-t * 7.5)
    tone = np.sin(2 * np.pi * f * t) + 0.42 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 10) + 0.16 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 16)
    return tone * env * (1 + 0.15 * np.sin(2 * np.pi * 5.5 * t))

def kick():
    t = np.arange(int(SR * 0.32)) / SR
    f = 46 + 90 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)

def noise_hit(dur, decay, hp):
    n = rng.standard_normal(int(SR * dur))
    n = n - np.convolve(n, np.ones(hp) / hp, "same")            # a crude high-pass: keep the hiss
    return n * np.exp(-np.arange(len(n)) / SR * decay)

def bright():
    beat = 60 / 104; bar = 4 * beat
    # D major: G – D – A – Bm  (IV – I – V – vi), voiced around middle C
    chords = [[55, 59, 62, 66], [50, 57, 62, 66], [57, 61, 64, 69], [59, 62, 66, 69]]
    roots = [43, 38, 45, 47]
    motif = [[74, 76, 78, None, 76, 74, None, 71], [74, None, 73, 74, 76, None, 74, None],
             [73, 76, 78, None, 81, 78, 76, None], [74, None, 71, 73, 74, None, None, None]]
    rhythm = [0, 0.75, 1.5, 2.0, 2.75, 3.5]                        # an off-beat pluck pattern, in beats
    t0, k = 0.0, 0
    while t0 < secs + 2:
        i = k % 4
        for b in rhythm:
            for j, m in enumerate(chords[i]):
                add(pluck(hz(m)), t0 + b * beat, pan=(j - 1.5) * 0.22, gain=0.05 * (1.1 if b in (0, 2.0) else 0.85))
        for b, o in ((0, 0), (1.5, 0), (2, 12), (3, 0), (3.5, 7)):
            add(bass(hz(roots[i] + o), beat * 0.9), t0 + b * beat, gain=0.14)
        if k >= 2:                                                   # the drums come in on the third bar
            for b in (0, 2): add(kick(), t0 + b * beat, gain=0.32)
            for b in (1, 3): add(noise_hit(0.12, 38, 3), t0 + b * beat, gain=0.045)
            for b in range(8): add(noise_hit(0.05, 90, 2), t0 + b * beat / 2 + (0.02 if b % 2 else 0), pan=0.3, gain=0.018 if b % 2 else 0.011)
        if k >= 4 and (k // 4) % 2 == 0:                             # the bell motif, every other phrase
            for b, m in enumerate(motif[i]):
                if m: add(bell(hz(m)), t0 + b * beat / 2, pan=-0.2, gain=0.06)
        t0 += bar; k += 1

def calm():
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

bright() if STYLE == "bright" else calm()

# reverb: a 2.6 s decaying noise tail, different per side
def verb(x, seed):
    r = np.random.default_rng(seed); n = int(SR * 2.6)
    ir = r.standard_normal(n) * np.exp(-np.arange(n) / SR * 2.4); ir /= np.sqrt((ir ** 2).sum())
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
wet = 0.2 if STYLE == "bright" else 0.32
L, R = L + wet * verb(L, 1), R + wet * verb(R, 2)

n = int(SR * secs); L, R = L[:n], R[:n]
fade = np.ones(n); fi, fo = int(SR * 2.5), int(SR * 5)
fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max()) or 1
st = (np.stack([L, R], 1) / peak * 0.89 * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
