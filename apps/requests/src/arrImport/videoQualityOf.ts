import { ResolutionSchema } from '@ValenceContracts/schemas/ParsedRelease';
import type { ReleaseSource, Resolution } from '@ValenceContracts/schemas/ParsedRelease';

type VideoQuality = { source: ReleaseSource; resolution: Resolution | null };

const NAMED: readonly { pattern: RegExp; source: ReleaseSource }[] = [
  { pattern: /^remux-(\d{3,4})p$/i, source: 'remux' },
  { pattern: /^bluray-(\d{3,4})p remux$/i, source: 'remux' },
  { pattern: /^bluray-(\d{3,4})p$/i, source: 'bluray' },
  { pattern: /^webdl-(\d{3,4})p$/i, source: 'webdl' },
  { pattern: /^webrip-(\d{3,4})p$/i, source: 'webrip' },
  { pattern: /^hdtv-(\d{3,4})p$/i, source: 'hdtv' },
];

const PLAIN: Readonly<Record<string, VideoQuality>> = {
  sdtv: { source: 'hdtv', resolution: '480p' },
  dvd: { source: 'dvd', resolution: '480p' },
  'dvd-r': { source: 'dvd', resolution: '480p' },
  telesync: { source: 'telesync', resolution: null },
  telecine: { source: 'telesync', resolution: null },
  cam: { source: 'cam', resolution: null },
  workprint: { source: 'cam', resolution: null },
};

/**
 * Which of Valence's sources and resolutions a quality Radarr or Sonarr names is, such as
 * `Bluray-1080p` or Sonarr's `Bluray-2160p Remux`; a quality Valence has no equivalent for, such as
 * `BR-DISK` or `Raw-HD`, is none.
 *
 * @param name - The quality's name.
 * @returns Its source and resolution, or null.
 */
const videoQualityOf = (name: string): VideoQuality | null => {
  const plain = PLAIN[name.trim().toLowerCase()];

  if (plain !== undefined) {
    return plain;
  }

  for (const { pattern, source } of NAMED) {
    const height = pattern.exec(name.trim())?.[1];
    const resolution = ResolutionSchema.safeParse(`${height ?? ''}p`);

    if (height !== undefined) {
      return resolution.success ? { source, resolution: resolution.data } : null;
    }
  }

  return null;
};

export type { VideoQuality };

export { videoQualityOf };
