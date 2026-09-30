import { say } from '@ValenceI18n/say';

const NO_SMALLER = say('client.playback.qualityStepDetail.noSmallerThanTheOriginal');

type QualityStepDetailOptions = {
  cost: string | undefined;
  isNoSmaller: boolean;
};

/**
 * What a smaller quality says beside its name: what it would cost, and that it would save nothing
 * where it would come out no smaller than the original.
 *
 * @param options - What it would cost, where that is known, and whether it would save nothing.
 * @returns The line to show, or nothing where there is nothing to say.
 */
const qualityStepDetail = ({ cost, isNoSmaller }: QualityStepDetailOptions): string | undefined => {
  if (!isNoSmaller) {
    return cost;
  }

  return cost === undefined
    ? NO_SMALLER
    : say('client.playback.qualityStepDetail.costNoSmallerThanTheOriginal', { cost });
};

export type { QualityStepDetailOptions };

export { qualityStepDetail };
