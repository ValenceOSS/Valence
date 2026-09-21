import { MUSIC_QUALITIES, RESOLUTIONS } from '@ValenceContracts/schemas/ParsedRelease';
import type { QualityProfileDraft } from '@ValenceContracts/schemas/QualityProfile';

const STARTER_PROFILES: readonly QualityProfileDraft[] = [
  { name: '4K', kind: 'video', resolutions: ['2160p'] },
  { name: '1080p', kind: 'video', resolutions: ['1080p'] },
  { name: '1080p or 720p', kind: 'video', resolutions: ['1080p', '720p'] },
  { name: '720p', kind: 'video', resolutions: ['720p'] },
  { name: 'Any', kind: 'video', resolutions: [...RESOLUTIONS] },
  { name: 'Lossless', kind: 'music', musicQualities: ['flac24', 'flac', 'alac'] },
  { name: 'MP3 320', kind: 'music', musicQualities: ['mp3-320', 'mp3-v0', 'aac'] },
  { name: 'Any music', kind: 'music', musicQualities: [...MUSIC_QUALITIES] },
];

export { STARTER_PROFILES };
