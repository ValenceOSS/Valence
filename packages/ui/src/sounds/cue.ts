import { play } from 'cuelume';
import { SOUNDS } from '@ValenceUI/sounds/SOUNDS';
import type { PlayOptions } from 'cuelume';
import type { OutcomeSound, PressSound } from '@ValenceUI/sounds/sounds.types';

/**
 * Plays one of the interface's sounds for something that happened rather than something pressed: a
 * dialog opening, work starting, an outcome arriving. Silent unless somebody has turned sounds on,
 * which only the application does; the docs and landing pages never do.
 *
 * @param sound - Which sound.
 * @param options - How it plays: how much it matters, which way it moves.
 */
const cue = (sound: OutcomeSound | PressSound, options?: PlayOptions): void => {
  if (SOUNDS.isOn) {
    play(sound, options);
  }
};

export { cue };
