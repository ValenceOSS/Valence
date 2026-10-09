import { partsOfVideoQuality } from '@ValenceContracts/functions/partsOfVideoQuality';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type {
  ParsedRelease,
  ReleaseSource,
  Resolution,
} from '@ValenceContracts/schemas/ParsedRelease';

const CINEMA: ReadonlySet<ReleaseSource> = new Set(['telesync', 'cam']);

/**
 * What about a video plainly makes it something a profile does not take: a recording made in a
 * cinema it does not ask for, or a resolution none of its qualities has. A cinema recording it asks
 * for is taken at any resolution.
 *
 * Only what is known counts, and only what plainly makes it another thing. Whether a file calls
 * itself WEB-DL where its title said WEBRip is labelling, and refusing over it would throw out good
 * releases by the dozen; a resolution or source nobody could tell is no evidence either way.
 *
 * @param quality - What the video is known to be.
 * @param profile - The profile it was asked for under.
 * @returns The quality it is refused for, or null where nothing known rules it out.
 */
const qualityRefusedBy = (
  quality: Partial<Pick<ParsedRelease, 'resolution' | 'source'>>,
  profile: QualityProfile,
): Resolution | ReleaseSource | null => {
  if (profile.kind !== 'video') {
    return null;
  }

  const { resolution = null, source = null } = quality;
  const allowed = profile.qualities.map(partsOfVideoQuality);

  if (source !== null && CINEMA.has(source)) {
    return allowed.some((one) => one.source === source) ? null : source;
  }

  return resolution !== null && !allowed.some((one) => one.resolution === resolution)
    ? resolution
    : null;
};

export { qualityRefusedBy };
