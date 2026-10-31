#!/usr/bin/env python3
"""The commercial's soundtrack: an original, generated heartland-rock anthem in the spirit of an
American pickup-truck advert — stomping drums in a big room, overdriven power-chord guitars
doubled left and right, a driving bass, a lead guitar hook, cymbal swells and cinematic hits.

    python3 music.py <out.wav>

120 bpm (a beat is 0.5 s, a bar 2 s), so the edit cuts on the beat. The form, in bars:
  0–1   intro: a low guitar swell, heartbeat booms, a reverse cymbal
  2–9   verse: the band hits — palm-muted E chugs with chord accents
  10–17 chorus: open chords E–C–G–D, crashes, tom fills, the lead hook
  18–19 breakdown: stomp and clap, a riser
  20–27 final chorus: double-time hats, the lead an octave up
  28–30 the ending: one big chord and a boom, ringing out
Generated, so there is nothing to license. Needs numpy.
"""
import sys, wave
import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
TOTAL = 31 * BAR + 1.5
N = int(SR * TOTAL)
rng = np.random.default_rng(11)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def bt(bar, beat=0.0): return bar * BAR + beat * BEAT

class Bus:
    def __init__(self): self.L = np.zeros(N); self.R = np.zeros(N)
    def add(self, sig, t, pan=0.0, gain=1.0):
        i = int(round(t * SR))
        if i >= N or i + len(sig) <= 0: return
        if i < 0: sig = sig[-i:]; i = 0
        sig = sig[: N - i] * gain
        self.L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2) * 1.414
        self.R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2) * 1.414

def fft_filter(x, fn):
    """filter a whole track in the frequency domain: fn(freqs) → gain"""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * fn(f), len(x))

def lp(f, fc, order=2): return 1 / np.sqrt(1 + (f / fc) ** (2 * order))
def hp(f, fc, order=2): return 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * order))
def peak(f, fc, gain_db, q=1.0):
    g = 10 ** (gain_db / 20)
    return 1 + (g - 1) * np.exp(-0.5 * (np.log2(np.maximum(f, 1) / fc) * q * 2.2) ** 2)

def reverb(x, secs, seed, damp=6000):
    n = int(SR * secs)
    r = np.random.default_rng(seed)
    t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-t * 6.9 / secs)
    ir[: int(SR * 0.012)] = 0
    ir = fft_filter(ir, lambda f: lp(f, damp, 1) * hp(f, 180, 1))
    ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + n
    size = 1 << int(np.ceil(np.log2(L)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return y

# ---------------------------------------------------------------- guitars
def saw_harm(f, n, nh, detune=0.0, bend=None):
    t = np.arange(n) / SR
    ph = 2 * np.pi * f * (1 + detune) * t
    if bend is not None: ph = 2 * np.pi * np.cumsum(f * (1 + detune) * bend) / SR
    s = np.zeros(n)
    for k in range(1, nh + 1):
        if f * k > 9000: break
        s += np.sin(k * ph + 0.3 * k) / k * (0.92 ** k)
    return s

def chord(root, dur, mute=False, take=0, notes=(0, 7, 12)):
    """an overdriven power chord: the strings summed, then clipped together"""
    ring = dur if mute else dur + 0.05
    n = int(SR * (ring + 0.06))
    t = np.arange(n) / SR
    nh = 7 if mute else 28
    s = np.zeros(n)
    for j, iv in enumerate(notes):
        strum = (j * 0.006 + take * 0.004) * SR
        sig = saw_harm(hz(root + iv), n, nh, detune=(take * 2 - 1) * 0.0018 + j * 0.0004)
        sig = np.roll(sig, int(strum)); sig[: int(strum)] = 0
        s += sig
    if mute: env = np.exp(-t * 16) * np.minimum(1, t / 0.002)
    else: env = np.minimum(1, t / 0.004) * (0.75 + 0.25 * np.exp(-t * 3))
    env *= np.clip((ring + 0.05 - t) / 0.05, 0, 1)
    drive = 9 if mute else 7
    return np.tanh(s * env * drive) * env ** 0.3

# ---------------------------------------------------------------- drums
def kick(big=False):
    n = int(SR * (0.6 if big else 0.4)); t = np.arange(n) / SR
    f = 44 + 120 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (5 if big else 8.5))
    click = rng.standard_normal(n) * np.exp(-t * 250) * 0.8
    return np.tanh((body + click) * 1.6)

def snare():
    n = int(SR * 0.45); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 22) + 0.5 * np.sin(2 * np.pi * 330 * t) * np.exp(-t * 30)
    nz = rng.standard_normal(n); nz = nz - np.convolve(nz, np.ones(6) / 6, "same")
    return tone * 0.8 + nz * np.exp(-t * 13) * 0.9

def tom(f0):
    n = int(SR * 0.7); t = np.arange(n) / SR
    f = f0 * (1 + 0.5 * np.exp(-t * 18))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) + rng.standard_normal(n) * np.exp(-t * 60) * 0.15

def crash(secs=3.0):
    n = int(SR * secs); t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    nz = nz - np.convolve(nz, np.ones(3) / 3, "same")
    ring = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) for f in (3150, 4420, 5310, 6900)) * 0.08
    return (nz * 0.6 + ring) * np.exp(-t * 2.2 / secs * 2) * np.minimum(1, t / 0.002)

def hat(open_=False):
    n = int(SR * (0.3 if open_ else 0.06)); t = np.arange(n) / SR
    nz = rng.standard_normal(n); nz = nz - np.convolve(nz, np.ones(2) / 2, "same")
    return nz * np.exp(-t * (12 if open_ else 70))

def clap():
    n = int(SR * 0.3); t = np.arange(n) / SR
    nz = rng.standard_normal(n); nz = nz - np.convolve(nz, np.ones(4) / 4, "same")
    env = np.zeros(n)
    for o in (0, 0.011, 0.023): env += np.where(t >= o, np.exp(-(t - o) * 90), 0)
    env += np.where(t >= 0.03, np.exp(-(t - 0.03) * 14), 0) * 0.6
    return nz * env

def stomp():
    n = int(SR * 0.5); t = np.arange(n) / SR
    f = 60 + 70 * np.exp(-t * 20)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) + rng.standard_normal(n) * np.exp(-t * 35) * 0.5

def boom(secs=3.0):
    n = int(SR * secs); t = np.arange(n) / SR
    f = 32 + 50 * np.exp(-t * 6)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    nz = rng.standard_normal(n) * np.exp(-t * 9)
    nz = np.convolve(nz, np.ones(40) / 40, "same") * 3
    return np.tanh((s + nz) * 1.4)

def riser(secs):
    n = int(SR * secs); t = np.arange(n) / SR
    nz = rng.standard_normal(n); nz = nz - np.convolve(nz, np.ones(3) / 3, "same")
    sw = np.sin(2 * np.pi * np.cumsum(200 + 1800 * (t / secs) ** 2) / SR) * 0.25
    return (nz * 0.5 + sw) * (t / secs) ** 2.5

def reverse_cymbal(secs):
    return crash(secs)[::-1] * 0.8

# ---------------------------------------------------------------- bass and lead
def bass_note(m, dur):
    n = int(SR * (dur + 0.05)); t = np.arange(n) / SR
    f = hz(m)
    s = 0.7 * np.sin(2 * np.pi * f * t) + 1.0 * saw_harm(f, n, 14)
    env = np.minimum(1, t / 0.004) * np.clip((dur + 0.05 - t) / 0.05, 0, 1) * (0.8 + 0.2 * np.exp(-t * 6))
    return np.tanh(s * env * 1.8)

def lead_note(m, dur, slide_from=None):
    n = int(SR * (dur + 0.15)); t = np.arange(n) / SR
    f = hz(m)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.18) / 0.2, 0, 1)
    bend = vib.copy()
    if slide_from is not None:
        r = hz(slide_from) / f
        bend *= r + (1 - r) * np.clip(t / 0.07, 0, 1)
    s = saw_harm(f, n, 20, bend=bend)
    env = np.minimum(1, t / 0.006) * np.clip((dur + 0.15 - t) / 0.12, 0, 1) * (0.85 + 0.15 * np.exp(-t * 4))
    return np.tanh(s * env * 6) * env

# ---------------------------------------------------------------- the arrangement
gtr, bas, drm, rev_send, lead, fx = Bus(), Bus(), Bus(), Bus(), Bus(), Bus()

E, G, A, C, D = 40, 43, 45, 48, 50

def gtr_chord(root, t, dur, mute=False, gain=1.0):
    for take, pan in ((0, -0.85), (1, 0.85)):
        gtr.add(chord(root, dur, mute, take), t + take * 0.007, pan=pan, gain=gain * (1.0 if mute else 0.95))

def bass_line(root, t, dur): bas.add(bass_note(root - 12, dur), t, gain=0.24)

# intro: a low E swell, heartbeat booms, a reverse cymbal into the hit
swell = chord(E, 2 * BAR - 0.1)
tt = np.arange(len(swell)) / SR
swell *= (tt / (2 * BAR)) ** 1.6
for take, pan in ((0, -0.7), (1, 0.7)): gtr.add(swell, take * 0.01, pan=pan, gain=0.75)
for b in (0, 1):
    for x in (0, 2):
        drm.add(kick(True), bt(b, x), gain=0.85); drm.add(kick(True), bt(b, x + 0.35), gain=0.5)
fx.add(reverse_cymbal(2 * BAR * 0.5), bt(1, 2) - 0.02, gain=0.55)
fx.add(riser(BAR), bt(1), gain=0.35)

def hit(t, big=True):
    fx.add(boom(3.5 if big else 2.0), t, gain=0.3 if big else 0.22)
    drm.add(crash(3.2), t, pan=-0.3, gain=0.42); drm.add(crash(3.0), t + 0.004, pan=0.35, gain=0.32)

hit(bt(2))

def groove(bar, dense=False, half=False):
    """one bar of drums: kick on 1 and 3 (plus pickups), snare on 2 and 4, hats"""
    for x in (0, 2) if not dense else (0, 1.5, 2, 2.75):
        drm.add(kick(), bt(bar, x), gain=0.42)
    if not half:
        for x in (1, 3): drm.add(snare(), bt(bar, x), gain=0.9); rev_send.add(snare(), bt(bar, x), gain=0.6)
    else:
        drm.add(snare(), bt(bar, 2), gain=0.66); rev_send.add(snare(), bt(bar, 2), gain=0.6)
    step = 0.5 if not dense else 0.25
    k = 0
    for x in np.arange(0, 4, step):
        drm.add(hat(open_=(dense and x % 1 == 0.5 and k % 4 == 1)), bt(bar, x), pan=0.35, gain=0.13 if x % 1 == 0 else 0.08); k += 1

def fill(bar):
    for i, (x, f) in enumerate(((3.0, 210), (3.25, 170), (3.5, 130), (3.75, 100))):
        drm.add(tom(f), bt(bar, x), pan=-0.4 + i * 0.27, gain=0.55); rev_send.add(tom(f), bt(bar, x), gain=0.3)

# verse: palm-muted chugs on E, chord accents at the end of each bar
for bar in range(2, 10):
    groove(bar)
    acc = [(G, 3.0), (A, 3.5)] if bar % 2 == 0 else [(D, 3.0), (C, 3.25), (D, 3.5)]
    for x in np.arange(0, 3, 0.5):
        if x == 0: gtr_chord(E, bt(bar, x), 0.45)
        else: gtr_chord(E, bt(bar, x), 0.22, mute=True)
    for i, (r, x) in enumerate(acc):
        nxt = acc[i + 1][1] if i + 1 < len(acc) else 4.0
        gtr_chord(r, bt(bar, x), (nxt - x) * BEAT - 0.02)
    for x in np.arange(0, 4, 0.5):
        r = E
        for (rr, xx) in acc:
            if x >= xx: r = rr
        bass_line(r, bt(bar, x), 0.45)
    if bar == 9: fill(bar)
    if bar == 5: drm.add(crash(2.0), bt(bar), pan=0.4, gain=0.25)

PROG = [E, C, G, D]
HOOK = [  # (beat offset in the 2-bar phrase, MIDI note, length in beats, slide from)
    [(0, 71, 1.5, 69), (1.5, 74, 0.5, None), (2, 76, 2, None), (4, 74, 1, None), (5, 72, 1, None), (6, 71, 2, None)],
    [(0, 67, 1.5, 66), (1.5, 71, 0.5, None), (2, 74, 2, None), (4, 72, 1, None), (5, 71, 1, None), (6, 69, 2, 67)],
]

def chorus(bars, octave=0, dense=False):
    for i, bar in enumerate(bars):
        root = PROG[i % 4]
        groove(bar, dense=dense)
        drm.add(crash(2.2), bt(bar), pan=(-0.4 if i % 2 else 0.4), gain=0.30)
        # open chord on 1, then driving eighths
        gtr_chord(root, bt(bar), 0.98)
        for x in np.arange(2, 4, 0.5): gtr_chord(root, bt(bar, x), 0.24, mute=(x % 1 == 0.5))
        for x in np.arange(0, 4, 0.5): bass_line(root, bt(bar, x), 0.45)
        if i % 4 == 3: fill(bar)
        if i % 2 == 0:
            for (o, m, l, sl) in HOOK[(i // 2) % 2]:
                tt = bt(bar, o)
                lead.add(lead_note(m + octave, l * BEAT - 0.03, None if sl is None else sl + octave), tt, pan=0.1, gain=0.42)

chorus(range(10, 18))

# breakdown: stomp, clap, a bass drone and a riser
for bar in (18, 19):
    for x in (0, 1, 2, 3):
        drm.add(stomp(), bt(bar, x), gain=0.65); rev_send.add(stomp(), bt(bar, x), gain=0.2)
        if x in (1, 3): drm.add(clap(), bt(bar, x), gain=0.5); rev_send.add(clap(), bt(bar, x), gain=0.6)
    bas.add(bass_note(E - 12, BAR - 0.02), bt(bar), gain=0.42)
gtr_chord(E, bt(18), BAR * 2 - 0.05, gain=0.55)
fx.add(riser(2 * BAR), bt(18), gain=0.45)
fx.add(reverse_cymbal(BAR), bt(19), gain=0.6)
for x in (3.0, 3.25, 3.5, 3.75): drm.add(snare(), bt(19, x), gain=0.45 + (x - 3) * 0.4)

# final chorus: the hit, double-time hats, the hook an octave up
hit(bt(20))
chorus(range(20, 28), octave=12, dense=True)

# the ending: one big chord, a boom, a last snare-and-crash, ringing out
hit(bt(28))
drm.add(kick(True), bt(28), gain=0.9); drm.add(snare(), bt(28), gain=0.7); rev_send.add(snare(), bt(28), gain=0.9)
for take, pan in ((0, -0.85), (1, 0.85)):
    c = chord(E, 2.5 * BAR); tt = np.arange(len(c)) / SR; c *= np.exp(-tt * 0.55)
    gtr.add(c, bt(28) + take * 0.007, pan=pan, gain=0.9)
bas.add(bass_note(E - 12, 2 * BAR) * np.exp(-np.arange(int(SR * (2 * BAR + 0.05))) / SR * 0.8), bt(28), gain=0.5)
lead.add(lead_note(88, 2.2 * BAR, 86), bt(28), gain=0.3)

# ---------------------------------------------------------------- the mix
def stereo_filter(bus, fn): bus.L = fft_filter(bus.L, fn); bus.R = fft_filter(bus.R, fn)

# guitar cabinet: no fizz, no mud, a presence bump
stereo_filter(gtr, lambda f: hp(f, 110) * lp(f, 6500, 3) * peak(f, 2600, 8, 1.0) * peak(f, 1100, 4, 1.0) * peak(f, 400, -3, 1.0))
stereo_filter(lead, lambda f: hp(f, 250) * lp(f, 5500, 2) * peak(f, 1800, 3))
stereo_filter(bas, lambda f: lp(f, 2500, 2) * hp(f, 45) * peak(f, 800, 6, 1.0))
stereo_filter(drm, lambda f: hp(f, 45) * lp(f, 13000, 1) * peak(f, 220, 3, 1.0) * peak(f, 3500, 5, 1.0))
stereo_filter(fx, lambda f: lp(f, 7000, 2))

# a room for the drums, a hall for the lead, a slapback delay on the lead
room = reverb(rev_send.L + rev_send.R, 1.9, 3, damp=5000)
hallL = reverb(lead.L, 2.6, 5); hallR = reverb(lead.R, 2.6, 6)
d = int(SR * BEAT * 0.75)
leadL = lead.L + np.concatenate([np.zeros(d), lead.R[:-d]]) * 0.32
leadR = lead.R + np.concatenate([np.zeros(d), lead.L[:-d]]) * 0.32
gtr_room = reverb(gtr.L + gtr.R, 1.2, 7, damp=3500) * 0.06
fxroom = reverb(fx.L + fx.R, 2.5, 9, damp=4000) * 0.25

L = gtr.L * 1.0 + bas.L + drm.L * 1.0 + room * 0.38 + leadL + hallL * 0.25 + gtr_room + fx.L + fxroom
R = gtr.R + bas.R + drm.R * 1.0 + room * 0.38 + leadR + hallR * 0.25 + gtr_room + fx.R + fxroom

L = fft_filter(L, lambda f: hp(f, 40, 2)); R = fft_filter(R, lambda f: hp(f, 40, 2))

# master: a slow compressor, a soft clip, -1 dB peaks
def envelope(x, att, rel):
    a = np.abs(x)
    # block-wise envelope (fast enough in numpy): 10 ms blocks
    blk = int(SR * 0.01)
    nb = len(a) // blk + 1
    pad = np.pad(a, (0, nb * blk - len(a)))
    peaks = pad.reshape(nb, blk).max(axis=1)
    env = np.zeros(nb); e = 0
    ka, kr = np.exp(-0.01 / att), np.exp(-0.01 / rel)
    for i, p in enumerate(peaks):
        e = ka * e + (1 - ka) * p if p > e else kr * e + (1 - kr) * p
        env[i] = e
    return np.repeat(env, blk)[: len(a)]

env = envelope(np.maximum(np.abs(L), np.abs(R)), 0.01, 0.25)
env /= env.max()
thr = 0.35
gain = np.where(env > thr, (thr + (env - thr) / 3.0) / np.maximum(env, 1e-9), 1.0)
L *= gain; R *= gain
m = max(np.abs(L).max(), np.abs(R).max())
L = np.tanh(L / m * 1.6) ; R = np.tanh(R / m * 1.6)
# fade the tail
fade = int(SR * 1.2)
L[-fade:] *= np.linspace(1, 0, fade); R[-fade:] *= np.linspace(1, 0, fade)
m = max(np.abs(L).max(), np.abs(R).max()) / 0.89
out = np.stack([L / m, R / m], axis=1)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
print("wrote", sys.argv[1], "·", round(TOTAL, 1), "s")
