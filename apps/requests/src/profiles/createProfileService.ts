import { randomUUID } from 'node:crypto';
import {
  QualityProfileChangeSchema,
  QualityProfileDraftSchema,
} from '@ValenceContracts/schemas/QualityProfile';
import type {
  QualityProfile,
  QualityProfileChange,
  QualityProfileDraft,
} from '@ValenceContracts/schemas/QualityProfile';
import type { RecordStore } from '@ValenceRequests/stores/RecordStore';

type CreateProfileServiceOptions = {
  store: RecordStore<QualityProfile>;
  now?: () => Date;
};

/**
 * Keeps the quality profiles searches are judged against, in order of their names.
 *
 * @param store - Where profiles are kept.
 * @param now - The clock.
 * @returns The service.
 */
const createProfileService = ({ store, now = () => new Date() }: CreateProfileServiceOptions) => ({
  list: async (): Promise<QualityProfile[]> =>
    (await store.list()).toSorted((left, right) => left.name.localeCompare(right.name)),

  find: (id: string): Promise<QualityProfile | null> => store.find(id),

  add: async (draft: QualityProfileDraft): Promise<QualityProfile> => {
    const at = now().toISOString();

    return store.insert({
      ...QualityProfileDraftSchema.parse(draft),
      id: randomUUID(),
      createdAt: at,
      updatedAt: at,
    });
  },

  change: (id: string, change: QualityProfileChange): Promise<QualityProfile | null> =>
    store.update(id, {
      ...Object.fromEntries(
        Object.entries(QualityProfileChangeSchema.parse(change)).filter(
          ([, value]) => value !== undefined,
        ),
      ),
      updatedAt: now().toISOString(),
    }),

  remove: (id: string): Promise<boolean> => store.remove(id),
});

type ProfileService = ReturnType<typeof createProfileService>;

export type { ProfileService };

export { createProfileService };
