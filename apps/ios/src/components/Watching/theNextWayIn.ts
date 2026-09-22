import type { HowClose } from '@ValencePhone/components/Watching/howBigToDrawIt';

const CLOSER: Record<HowClose, HowClose> = { safe: 'edge', edge: 'full', full: 'full' };

const FURTHER: Record<HowClose, HowClose> = { full: 'edge', edge: 'safe', safe: 'safe' };

/**
 * The next of the three ways a film can be drawn, in whichever direction they pinched.
 *
 * One step per pinch rather than a jump to the end, so the middle one — reaching the edges without
 * losing anything — is somewhere a pinch can actually stop rather than somewhere it passes through.
 *
 * Pinching further in the direction it is already at the end of leaves it there, which is quieter
 * than wrapping round to the other end when somebody keeps pushing.
 *
 * @param from - How it is drawn now.
 * @param way - Whether the fingers went apart or together.
 * @returns How it should be drawn next.
 */
const theNextWayIn = (from: HowClose, way: 'apart' | 'together'): HowClose =>
  way === 'apart' ? CLOSER[from] : FURTHER[from];

export { theNextWayIn };
