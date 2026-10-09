import { MUSIC_QUALITIES } from '@ValenceContracts/schemas/ParsedRelease';
import { VIDEO_QUALITY_IDS } from '@ValenceContracts/schemas/QualityProfile';
import type { Resolution } from '@ValenceContracts/schemas/ParsedRelease';
import type { QualityProfileDraft, VideoQualityId } from '@ValenceContracts/schemas/QualityProfile';
import { say } from '@ValenceI18n/say';

const OFF_THE_SHELF: ReadonlySet<string> = new Set(['dvd', 'telesync', 'cam']);

/**
 * The qualities at some resolutions, best first, from every source but DVDs and cinema recordings.
 *
 * @param resolutions - The resolutions.
 * @returns The qualities.
 */
const qualitiesAt = (...resolutions: Resolution[]): VideoQualityId[] =>
  VIDEO_QUALITY_IDS.filter((id) => {
    const [source = '', resolution = ''] = id.split('-');

    return !OFF_THE_SHELF.has(source) && resolutions.some((one) => one === resolution);
  });

const STARTER_PROFILES: readonly QualityProfileDraft[] = [
  { name: '4K', kind: 'video', qualities: qualitiesAt('2160p') },
  { name: '1080p', kind: 'video', qualities: qualitiesAt('1080p') },
  { name: '1080p or 720p', kind: 'video', qualities: qualitiesAt('1080p', '720p') },
  { name: '720p', kind: 'video', qualities: qualitiesAt('720p') },
  {
    name: say('common.any'),
    kind: 'video',
    qualities: qualitiesAt('2160p', '1080p', '720p', '576p', '480p'),
  },
  { name: say('common.lossless'), kind: 'music', musicQualities: ['flac24', 'flac', 'alac'] },
  { name: 'MP3 320', kind: 'music', musicQualities: ['mp3-320', 'mp3-v0', 'aac'] },
  {
    name: say('requests.profiles.starterProfiles.anyMusic'),
    kind: 'music',
    musicQualities: [...MUSIC_QUALITIES],
  },
];

export { STARTER_PROFILES };
