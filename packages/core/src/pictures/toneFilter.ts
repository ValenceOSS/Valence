import type { PictureTone } from './PictureTone';

/**
 * The CSS filter that draws a tone's adjustments, in the order every place that draws one applies
 * them: how colourful, then how far round the colour wheel, then how contrasting, then how bright. A tone that changes nothing draws no
 * filter.
 *
 * @param tone - The tone.
 * @returns The filter, or nothing.
 */
const toneFilter = (tone: PictureTone): string | undefined => {
  const steps = [
    tone.saturate === 1 ? null : `saturate(${tone.saturate.toString()})`,
    tone.hueRotate === 0 ? null : `hue-rotate(${tone.hueRotate.toString()}deg)`,
    tone.contrast === 1 ? null : `contrast(${tone.contrast.toString()})`,
    tone.brightness === 1 ? null : `brightness(${tone.brightness.toString()})`,
  ].filter((step) => step !== null);

  return steps.length === 0 ? undefined : steps.join(' ');
};

export { toneFilter };
