// Entry point loaded by /player.html?ep=<this episode>. Timing: ../assets/cues.json,
// mouths: ../assets/lipsync.json, sound: ../assets/mix.wav (all from audio/build.py).
import { createRenderer, loadFonts, json, startPlayer, compositor } from '../../../engine/player.js';
import { build } from './film.js';

const { renderer, env } = createRenderer();
await loadFonts();
const [cues, lipsync] = await Promise.all([json(import.meta.url, '../assets/cues.json'), json(import.meta.url, '../assets/lipsync.json')]);
const film = build({ lipsync, cues: cues.cues });
film.scene.environment = env;
film.update(0); renderer.compile(film.scene, film.camera);
startPlayer({ duration: cues.duration, audio: new URL('../assets/mix.wav', import.meta.url), render: compositor(renderer, film), title: 'berry-heist' });
