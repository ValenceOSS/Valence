import type { useKeepsStill as onTheTelevision } from '@ValenceTv/platform/useKeepsStill';

/**
 * Whether a television's browser keeps things still, which it always does. Its processor is a
 * phone's from years ago, and in a browser every animation runs in JavaScript a frame at a time,
 * with no native driver to hand it to: the way in and every lift of a card stuttered.
 *
 * @returns Yes.
 */
const useKeepsStill: typeof onTheTelevision = () => true;

export { useKeepsStill };
