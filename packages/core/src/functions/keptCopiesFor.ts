import { QUALITY_STEP_IDS, QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { chooseSource } from '@ValenceCore/functions/chooseSource';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { KeptCopy } from '@ValenceContracts/schemas/KeptCopy';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';
import type { ChosenSource, PlayableSource } from '@ValenceCore/functions/chooseSource';

/**
 * The quality step a picture of this size belongs to: the largest whose frame it reaches in either
 * direction, so a 3840×1600 film counts as 4K rather than 1440p.
 *
 * @param width - The picture's width.
 * @param height - The picture's height.
 * @returns The step.
 */
const stepOfPicture = (width: number, height: number): QualityStepId =>
  QUALITY_STEPS.find((step) => width >= step.maxWidth || height >= step.maxHeight)?.id ?? '144p';

/**
 * The copies kept beside an item that a device can be handed as they are, each under its own
 * quality step, found by asking for every step exactly as a session would and keeping only the
 * answers that are a kept copy played directly — so a player that switches between them on its own
 * never meets one the server would have had to encode, and never disagrees with the server about
 * which copy a step means. Each copy is listed once, named for the size of its picture, and where
 * two share a size the larger is kept.
 *
 * @param options - The item's files, the device asking, and where a file is fetched from.
 * @returns The copies, largest first.
 */
const keptCopiesFor = ({
  sources,
  profile,
  fileUrl,
}: {
  sources: readonly PlayableSource[];
  profile: DeviceProfile;
  fileUrl: (sourceId: string) => string;
}): KeptCopy[] => {
  const found = new Map<QualityStepId, ChosenSource>();

  for (const quality of QUALITY_STEP_IDS) {
    const chosen = chooseSource({ sources, profile, requestedQuality: quality });

    if (chosen !== null && !chosen.source.isOriginal && chosen.isDirectPlay) {
      const step = stepOfPicture(chosen.source.item.width, chosen.source.item.height);

      if (!found.has(step)) {
        found.set(step, chosen);
      }
    }
  }

  return QUALITY_STEP_IDS.flatMap((quality) => {
    const chosen = found.get(quality);

    if (chosen === undefined) {
      return [];
    }

    const { item } = chosen.source;

    return [
      {
        quality,
        url: fileUrl(chosen.source.id),
        container: item.container,
        videoCodec: item.videoCodec,
        videoRange: item.videoRange,
        videoBitDepth: item.videoBitDepth,
        width: item.width,
        height: item.height,
        bitrateKbps: item.bitrateKbps,
      },
    ];
  });
};

export { keptCopiesFor };
