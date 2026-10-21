# 🎂 For CS Gurleen Kaur (Gullu)

A modern, slide-by-slide digital birthday letter. 8 chapters, 19 memories, unique layouts on every slide (polaroid → diptych → scattered collage → feature + thumbnails → 2×2 mosaic → circle portrait → filmstrip → postcard → make-a-wish candle → gratitude finale).

Pure HTML/CSS/JS. No build step. Free hosting on Vercel.

---

## ✏️ Step 1 — Add her photos

Copy all 19 WhatsApp photos into the `images/` folder, then run this once from the `CSG/` folder to rename them cleanly:

```bash
bash rename-photos.sh
```

That renames them to `photo01.jpg` through `photo19.jpg` in the same order they were listed.

If you prefer to rename manually, just make sure the final filenames are:
```
images/photo01.jpg
images/photo02.jpg
…
images/photo19.jpg
```

**Missing a photo?** The site shows a soft placeholder card — nothing breaks.

## ✏️ Step 2 — Preview

Just open `index.html` in your browser. That's it.
Or run a mini server for a nicer URL:
```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## ✏️ Step 3 — Tweak the words (optional)

Every quote and reflection lives in `index.html`. Search for `class="quote"` and `class="reflection"` — swap the text with your own words.

The hero name is already set to **Gullu** with the subline **CS GURLEEN KAUR**.

## 🚀 Deploy free to Vercel

**Easiest — drag & drop:**
1. Go to https://vercel.com/new
2. Sign in
3. Drag the whole `CSG` folder in
4. Click Deploy → live URL in ~15 seconds

**Or via CLI:**
```bash
npm i -g vercel
cd CSG
vercel
```

**Or via GitHub:**
Push the folder to a new GitHub repo → Import Project on vercel.com/new → pick the repo. Every push auto-deploys.

---

## 🔒 Asset security — what's protecting her photos

Client-side only (no server needed), so it deters casual copying but is not bulletproof:

- `noindex, noimageindex` meta tags → search engines skip the page and her photos
- `no-referrer` → other sites can't tell people came from here
- Right-click disabled with a soft toast
- Drag-to-save on images disabled
- `Ctrl/Cmd + S`, `Ctrl + U`, `F12`, and dev-tools shortcuts intercepted
- Text/image selection disabled globally
- Invisible transparent "shield" over every photo blocks easy right-click targeting

**Want stronger protection?** Options:
- Put the page behind Vercel Password Protection (Settings → Deployment Protection → Password) — best single upgrade.
- Only share the URL privately (don't post publicly).
- If you eventually want per-visitor auth, use a Vercel Edge Function with a shared password.

Nothing served to a browser can be 100% locked down, but this combo is enough for a private link shared with her only.

---

## 🎨 The 11 slides

| # | Layout | Photos |
|---|---|---|
| 1 | Hero — "happy birthday, Gullu" | — |
| 2 | Polaroid (single) | 01 |
| 3 | Diptych (two side-by-side) | 02, 03 |
| 4 | Scattered collage | 04, 05, 06 |
| 5 | Feature + thumbnail strip | 07, 08, 09, 10 |
| 6 | 2×2 mosaic with heart in the middle | 11, 12, 13, 14 |
| 7 | Circle portrait with rotating halo | 15 |
| 8 | Filmstrip (dark film reel) | 16, 17, 18 |
| 9 | Postcard (AIR MAIL style) | 19 |
| 10 | Make-a-wish candle | — |
| 11 | Gratitude finale | — |

Navigation: arrow keys, swipe on mobile, click arrows/dots, or the "begin the letter" CTA.

Made with 🩷.
