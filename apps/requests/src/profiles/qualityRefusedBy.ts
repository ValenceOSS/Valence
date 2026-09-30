import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type {
  ParsedRelease,
  ReleaseSource,
  Resolution,
} from '@ValenceContracts/schemas/ParsedRelease';

const CINEMA: ReadonlySet<ReleaseSource> = new Set(['telesync', 'cam']);

/**
 * What about a video plainly makes it something a profile does not take: a resolution off its
 * list, or a recording made in a cinema it does not ask for.
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

  if (resolution !== null && !profile.resolutions.includes(resolution)) {
    return resolution;
  }

  return source !== null && CINEMA.has(source) && !profile.sources.includes(source) ? source : null;
};

export { qualityRefusedBy };
