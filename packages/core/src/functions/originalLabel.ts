import { sharpestStepOf } from '@ValenceCore/functions/sharpestStepOf';
import { say } from '@ValenceI18n/say';

/**
 * What the file as it is on the server is called in a list of qualities, with how sharp it is.
 *
 * @param size - The picture's width and height.
 * @returns "Original", followed by its resolution where it has one worth naming.
 */
const originalLabel = (size: { width: number; height: number }): string => {
  const step = sharpestStepOf(size);

  return step === null
    ? say('common.original')
    : say('core.originalLabel.originalLabel', { label: step.label });
};

export { originalLabel };
