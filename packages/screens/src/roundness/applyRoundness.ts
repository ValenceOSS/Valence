import { ROUNDNESS_SCALES } from '@ValenceContracts/schemas/Roundness';
import type { Roundness } from '@ValenceContracts/schemas/Roundness';

/**
 * Puts a chosen roundness on the document, where every radius in the stylesheet reads it. Every
 * corner in Valence is drawn from a token that is multiplied by one number, so changing that number
 * changes them all together and nothing has to opt in.
 *
 * @param roundness - What was chosen.
 * @param root - The element to mark, which is the document's own in everything but a test.
 */
const applyRoundness = (
  roundness: Roundness,
  root: HTMLElement = document.documentElement,
): void => {
  root.style.setProperty('--radius-scale', ROUNDNESS_SCALES[roundness].toString());
};

export { applyRoundness };
