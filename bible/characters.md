# Mochi Family: character bible

Six small friends with big ideas. Every character must read instantly from **silhouette + colour +
one signature accessory**, and the comedy comes from how differently they react to the same thing.
Code lives in `engine/characters/mochi.js`. Check changes with `node tools/check.mjs model-sheet --n 8 --cols 4`.

| | Milo | Lumi | Pip | Mimi | Moss | Bobo |
|---|---|---|---|---|---|---|
| **Sheet role** | The Inventor | The Scientist | The Energizer | The Artist | The Explorer | The Pet |
| **Comedy role** | overconfident mastermind; first to cause the accident | deadpan straight-man; the adult in the room | gadget chaos; curious, cheerful, a little dim | reactions, visual gags; turns anything into "art" | quiet dry humour; useful info, always too late | chaos agent; accidentally solves (or ruins) everything |
| **Body colour** | orange `#ff8a2a` | blue `#5b8cff` | yellow `#ffcf33` | pink `#ff8fb3` | green `#8fd35a` | cream `#faf3e6` + brown ears |
| **Signature** | swirl curl + headphones | bunny antennae + round glasses | cap with ⚡ badge | big pink bow | sprout (2 leaves) + backpack | floppy ears, tail, tongue |
| **Caption colour** | `#ff7a1a` | `#4a7cff` | `#e8a800` | `#ff5f97` | `#4caf3a` | — |
| **Voice** (`audio/voices.py`) | `en-us+m3`, low & flat, whispers on missions | `en-us+f3`, almost no pitch range | `en-us+m7`, wide range, fast | `en-us+f2`, bright | `en-us+m1`, slow, low | no lines: `sniff` `yip` `woof` `nom` |
| **Typical line** | "Never question the mission." | "I doubt that." | "Watch this." | "I liked it." | "…I was about to suggest that." | *sniff sniff* |

## Personalities

- **Milo** is creative and tinkering, and sure that every plan of his is genius. He speaks in
  short, serious sentences. He never admits a mistake and has a technically-true excuse for
  everything ("…on that shelf.").
- **Lumi** is smart, says little and loves *why?*. She is the deadpan anchor: her lines are short,
  and her silence is a punchline. She is the only one who is never in on the chaos.
- **Pip** is energetic and positive, and loves gadgets that are advertised as amazing and work
  badly (LASER 9000). He gets hurt by his own inventions and stays proud of them ("…worth it.").
- **Mimi** is emotional, loves beauty and reacts big: giggles, snorts, "I liked it." She props
  every gag with art and disguises ("DEFINITELY NOT STOLEN").
- **Moss** is calm and observant. He mostly reacts with his eyes. His rare lines are dry and late
  ("I'm… a plant."). His sprout is a running visual gag: it falls off, or stays huge.
- **Bobo** is a happy pup. He never understands the plan and pushes the button nobody else would.
  *The team uses complex tech; the dog just presses OPEN.* That is the channel's running gag.

## Faces & poses (API)

`k.setFace(name)`, applied immediately:

| face | meaning |
|---|---|
| `open` | neutral (blinks automatically) |
| `happy` | ^ ^ eyes |
| `wink` | wink |
| `flat` | half-lidded, unimpressed |
| `angry` | angled brows |
| `wide` | shocked |
| `closed` | eyes shut |

`k.setSing(0..1)` opens the mouth. It is normally driven by `mouth(lipsync, who, T)`.

Body controls:
- `k.update(T, {bounce, blink, wave})`
- `k.armL` / `k.armR`: rotation `.z` raises the arm sideways (about 2.3 is fully up); `.x` swings it forward.
- `k.bodyG.rotation` makes the character lean.
- Anchors for props: `k.top` (hats), `k.face` (glasses), `k.armR.hand` (held props).
- Bobo has `head` instead of `face`, plus `setSing(v)` for tongue and bark.

## Rules

- Do not change body shapes or colours per episode. Costumes go *on top* (`top`, `face`, `waistAnchor`/`bodyG`).
- Keep everyone at `scale 1` (Bobo 0.8) unless the gag is about size.
- Bobo never speaks words. Moss never gets more than one line per scene.
- Lumi wins every argument.
