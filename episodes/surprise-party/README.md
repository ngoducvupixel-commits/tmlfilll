# Surprise! (Mochi Family short)

The family throws Lumi a surprise birthday party in a sunny pastel living room. The banner falls on
Moss, Pip's party popper goes off early, and the birthday is next week anyway. Bobo has already
eaten the cake.

The first episode with the **cute look**:
- `useLook('jelly')` for glossy characters
- `compositor(..., { look: 'dreamy' })` for soft bloom, a warm grade and a vignette
- a key-art living room: window with sky, corkboard, rainbow picture, bookshelf, bunting,
  balloons, sun shafts

```bash
npm run serve                                   # http://localhost:8080/player.html?ep=surprise-party
.venv/bin/python audio/build.py surprise-party  # voices + SFX + timing from beats.py
node tools/check.mjs surprise-party --n 24      # contact sheet
node tools/render.mjs surprise-party            # → out/surprise-party.mp4
```

| scene | beats |
|---|---|
| 1 Banner | Mimi directs ("A little left… More left…"), Milo leans, the banner falls on Moss: "…I'm fine." |
| 2 Cake | Pip rolls in the cake: "Behold!" · Mimi: "It's beautiful!" · Bobo sniffs and drools |
| 3 Hide | keys in the door · "She's coming." · "Everybody hide!" (sofa, curtain, cart; Moss becomes a lamp) |
| 4 Surprise | Lumi enters, **2.6 s of silence**, the popper goes off early: "…oops." · "SURPRISE!" |
| 5 Wrong day | "…Is it my birthday?" "Yes!" "It's next week." **2.2 s of silence** · "…Early surprise." · "So… can we eat the cake now?" |
| 6 Button | Bobo face-first in the cake · Lumi smiles: "…Best birthday ever." · WOOF, cream everywhere |
