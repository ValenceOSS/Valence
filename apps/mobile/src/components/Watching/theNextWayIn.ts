import type { HowClose } from '@ValenceMobile/components/Watching/howBigToDrawIt';

/**
 * Which of the two ways a film should be drawn, given the way they pinched.
 *
 * Pinching further in the direction it is already at the end of leaves it there, which is quieter
 * than flipping back and forth when somebody keeps pushing.
 *
 * @param way - Whether the fingers went apart or together.
 * @returns How it should be drawn.
 */
const theNextWayIn = (way: 'apart' | 'together'): HowClose => (way === 'apart' ? 'edge' : 'safe');

export { theNextWayIn };
