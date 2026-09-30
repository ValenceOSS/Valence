import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import { QUALITY_LABELS } from '@ValenceRequests/profiles/QUALITY_LABELS';
import { qualityRefusedBy } from '@ValenceRequests/profiles/qualityRefusedBy';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * Whether the videos a release actually holds are ones the profile takes, judged by what their own
 * names say rather than by the release's title.
 *
 * A title can claim anything: one sold as 4K held a 1080p recording made in a cinema. What each
 * video's name states is judged as `qualityRefusedBy` judges it, so a name that says nothing, as an
 * episode in a pack often does, counts for nothing either way.
 *
 * @param videos - The names of the videos it holds, as the download client lists them.
 * @param profile - The profile it was asked for under.
 * @returns Why it is not wanted, or null where nothing its files say rules it out.
 */
const whatTheFilesSay = (videos: readonly string[], profile: QualityProfile): string | null => {
  for (const video of videos) {
    const named = video.slice(Math.max(video.lastIndexOf('/'), video.lastIndexOf('\\')) + 1);
    const stem = named.includes('.') ? named.slice(0, named.lastIndexOf('.')) : named;
    const refused = qualityRefusedBy(parseReleaseName(stem), profile);

    if (refused !== null) {
      return `Its file, ${named}, is ${QUALITY_LABELS[refused]}, which this profile does not take`;
    }
  }

  return null;
};

export { whatTheFilesSay };
