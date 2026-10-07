import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';

/**
 * Whether this television keeps things still rather than moving them into place: where somebody
 * has asked the system for less motion.
 *
 * @returns Whether to keep still.
 */
const useKeepsStill = (): boolean => usePrefersStillness();

export { useKeepsStill };
