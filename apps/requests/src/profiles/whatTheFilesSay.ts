import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import { QUALITY_LABELS } from '@ValenceRequests/profiles/QUALITY_LABELS';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * Whether the videos a release actually holds are ones the profile takes, judged by what their own
 * names say rather than by the release's title.
 *
 * A title can claim anything: one sold as 4K held a 1080p recording made in a cinema. Only what a
 * name states is held against it — a resolution or a source the profile does not take — since a
 * name that says nothing, as an episode in a pack often does, is no evidence either way.
 *
 * @param videos - The names of the videos it holds, as the download client lists them.
 * @param profile - The profile it was asked for under.
 * @returns Why it is not wanted, or null where nothing its files say rules it out.
 */
const whatTheFilesSay = (videos: readonly string[], profile: QualityProfile): string | null => {
  if (profile.kind !== 'video') {
    return null;
  }

  for (const video of videos) {
    const named = video.slice(video.lastIndexOf('/') + 1);
    const stem = named.includes('.') ? named.slice(0, named.lastIndexOf('.')) : named;
    const { resolution, source } = parseReleaseName(stem);
    const refused =
      resolution !== null && !profile.resolutions.includes(resolution)
        ? resolution
        : source !== null && !profile.sources.includes(source)
          ? source
          : null;

    if (refused !== null) {
      return `Its file, ${named}, is ${QUALITY_LABELS[refused]}, which this profile does not take`;
    }
  }

  return null;
};

export { whatTheFilesSay };
