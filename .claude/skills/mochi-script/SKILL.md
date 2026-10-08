---
name: mochi-script
description: Write or punch up a Mochi Family comedy script and turn it into a timed scene table and beat list in the channel format. Use when the user wants a story idea, a script, a rewrite, dialogue, a shot list, or timing for a Mochi short.
---

# Mochi scripts

Rules come from `bible/characters.md` (who says what) and `bible/style.md` (comedy rules).

## Output format (give the user this, in their language; dialogue stays English)

1. **Logline** — one sentence.
2. **Scene table** — `| # | time | what we see | dialogue / sound |`, scenes of 3–10 s.
3. **Beat list** — the exact order of beats that will become `beats.py`:
   `mark s1 1.5s · vo milo "…" · fx whoosh · mark pause 2s (silent) · …`
4. **Notes** — anything you changed from the user's script and why (one line each).

## Writing rules

- Every scene has one job: setup, escalation, punchline, or button. Cut anything else.
- Lines ≤ 8 words where possible; espeak voices sound best on short lines. Deadpan = shortest.
- Mark comic pauses explicitly ("pause 2s — silent"). They become `keep` + `silences` marks.
- Bobo has no words. Moss ≤ 1 line per scene. Lumi gets the last word.
- Each joke must be *visible*: if a gag needs a prop (sign text, bag label, handprint), list it.
- Physical comedy must be doable with the rig: walk, jump, lean, spin, fall flat (rotate root),
  shrink/grow (scale), arms up/forward, faces. No fingers, no lip-precise acting.
- Length: 45–60 s for shorts. ~2.5 words/s of dialogue + pauses. Count it; if over, cut beats.
- Keep it kid-safe and kind: teasing is fine, insults/violence are not ("Pip stupid", not "you idiot").

## Timing estimate

`duration ≈ Σ(words)/2.8 + Σ(pauses) + 0.4 s × (number of lines)`. State it in the table header.
