import { QualityProfileDraftSchema } from '@ValenceContracts/schemas/QualityProfile';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * A video profile as a new one is made, with anything a test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The profile.
 */
const aProfile = (overrides: Partial<QualityProfile> = {}): QualityProfile => ({
  ...QualityProfileDraftSchema.parse({ name: 'HD', kind: 'video' }),
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

export { aProfile };
