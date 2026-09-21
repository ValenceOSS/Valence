import { RESOLUTIONS } from '@ValenceContracts/schemas/ParsedRelease';
import type { QualityProfileDraft } from '@ValenceContracts/schemas/QualityProfile';

const STARTER_PROFILES: readonly QualityProfileDraft[] = [
  { name: '4K', kind: 'video', resolutions: ['2160p'] },
  { name: '1080p', kind: 'video', resolutions: ['1080p'] },
  { name: '1080p or 720p', kind: 'video', resolutions: ['1080p', '720p'] },
  { name: '720p', kind: 'video', resolutions: ['720p'] },
  { name: 'Any', kind: 'video', resolutions: [...RESOLUTIONS] },
];

export { STARTER_PROFILES };
