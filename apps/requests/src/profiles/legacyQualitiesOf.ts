import { videoQualityIdOf } from '@ValenceContracts/functions/videoQualityIdOf';
import type { ReleaseSource, Resolution } from '@ValenceContracts/schemas/ParsedRelease';
import type { VideoQualityId } from '@ValenceContracts/schemas/QualityProfile';

type LegacyQualities = {
  resolutions: readonly Resolution[];
  sources: readonly ReleaseSource[];
  upgradeUntilResolution: Resolution | null;
  upgradeUntilSource: ReleaseSource | null;
};

/**
 * The combined qualities a profile kept before qualities were combined takes, in the order it
 * ranked them: every resolution it took, best first, and within each every source it took, best
 * first — which is how its scores put them. Its cutoff is the quality its resolution and source to
 * upgrade until make, or the best of that resolution where it named no source.
 *
 * @param kept - The resolutions and sources it took, and what it upgraded until.
 * @returns Its qualities, best first, and its cutoff.
 */
const legacyQualitiesOf = (
  kept: LegacyQualities,
): { qualities: VideoQualityId[]; cutoff: VideoQualityId | null } => {
  const qualities = kept.resolutions.flatMap((resolution) =>
    kept.sources.flatMap((source) => {
      const id = videoQualityIdOf(source, resolution);

      return id === null ? [] : [id];
    }),
  );
  const cutoff =
    kept.upgradeUntilResolution === null
      ? null
      : kept.upgradeUntilSource === null
        ? (qualities.find((id) => id.endsWith(`-${kept.upgradeUntilResolution ?? ''}`)) ?? null)
        : videoQualityIdOf(kept.upgradeUntilSource, kept.upgradeUntilResolution);

  return { qualities: [...new Set(qualities)], cutoff };
};

export { legacyQualitiesOf };
