# The commercial

A 63-second commercial for the Employee Portal, cut on the beat to a generated
pickup-truck-advert rock anthem: fast cuts, whip pans, 3D screens, a phone, kinetic titles.
Output: `docs/films/GALIL-Employee-Portal-Commercial.mp4` (1080p, 30 fps).

```bash
node tools/commercial/shoot.js            # 1. films the clips from the real app (demo data) → build/shots/
python3 tools/commercial/music.py tools/commercial/build/music.wav   # 2. the soundtrack (needs numpy)
node tools/commercial/render.js           # 3. draws stage.html frame by frame and joins it with the music
```

- `shoot.js` — one entry per clip in `SHOTS`; `node shoot.js timelog,board` re-films only those.
- `music.py` — 120 bpm, so a bar is 2 s; the form (intro, verse, chorus, breakdown, final chorus, ending) is in its header.
- `stage.html` — the edit: the timeline (`seg(...)`), the words, the layouts and transitions. Times are in bars and beats (`at(bar, beat)`).
- `render.js` — `STILLS=5,12.3` renders single frames, `FROM=20 TO=24` a short preview (`build/preview.mp4`).

Needs Playwright (Chromium), ffmpeg and python3 with numpy. `build/` is not committed.
