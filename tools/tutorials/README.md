# Tutorial films

`make.js` films a tutorial of the Employee Portal from a scene script in `scenes/`.
It drives the real app in a browser with the demo data, and draws an on-screen
cursor, a spotlight on the part being explained and large captions. The output is a
1080p MP4 with upbeat generated background music (`music.py`, no licence needed; a scene can set `music: "calm"` for the slower track) and
the captions as a subtitle track, plus a `.srt` beside it.

```bash
cd tests/workdesk          # for Playwright
node ../../tools/tutorials/make.js workdesk-planner-desktop en
# → docs/films/tutorials/workdesk-planner-desktop.en.mp4 and .en.srt
```

Needs `ffmpeg`, and `python3` with `numpy`.

A scene exports `user`, `viewport`, `start` (the screen to open), an optional
`setup(page)` that seeds demo data, and `steps(T)`, written with:

| Call | What it does |
|---|---|
| `T.card(kicker, title, sub, secs)` | a full-screen title card |
| `T.say(html, { spot, keep, secs })` | a caption, with the spotlight on `spot`; stays up for `secs` (by default, long enough to read) |
| `T.click(locator)` / `T.fill` / `T.type` / `T.select` | the cursor moves there, then acts |
| `T.drag(from, to)` | the cursor carries a copy of `from` onto `to`, then drops it |
| `T.clear()` | takes the caption and the spotlight away |
