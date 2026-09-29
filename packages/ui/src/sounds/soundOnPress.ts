import type { PressSound } from '@ValenceUI/sounds/sounds.types';

/**
 * The attribute that makes a control play a sound when it is pressed, typed into, or chosen from, to
 * spread onto the element that is pressed. Nothing is heard until sounds are switched on.
 *
 * @param sound - Which sound, or `type` for a field typed into, or none for a control that stays
 *   quiet because something else already says what happened.
 * @returns The attribute, or nothing.
 */
const soundOnPress = (sound: PressSound | 'type' | 'none'): Record<string, string> =>
  sound === 'none' ? {} : { [`data-cuelume-${sound}`]: '' };

export { soundOnPress };
