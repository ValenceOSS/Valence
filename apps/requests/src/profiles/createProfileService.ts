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
 * A default profile is what every request of its kind goes through, so there is at most one of
 * them per kind: marking a profile as the default unmarks whichever held it. Enforced here rather
 * than left to whoever is calling, because two defaults is not a state the rest of requesting knows
 * how to read — it would pick whichever the store happened to list first.
 *
 * @param store - Where profiles are kept.
 * @param now - The clock.
 * @returns The service.
 */
const createProfileService = ({ store, now = () => new Date() }: CreateProfileServiceOptions) => {
  const standDown = async (kept: QualityProfile): Promise<void> => {
    if (!kept.isDefault) {
      return;
    }

    const at = now().toISOString();

    for (const other of await store.list()) {
      if (other.id !== kept.id && other.kind === kept.kind && other.isDefault) {
        await store.update(other.id, { isDefault: false, updatedAt: at });
      }
    }
  };

  return {
    list: async (): Promise<QualityProfile[]> =>
      (await store.list()).toSorted((left, right) => left.name.localeCompare(right.name)),

    find: (id: string): Promise<QualityProfile | null> => store.find(id),

    add: async (draft: QualityProfileDraft): Promise<QualityProfile> => {
      const at = now().toISOString();
      const kept = await store.insert({
        ...QualityProfileDraftSchema.parse(draft),
        id: randomUUID(),
        createdAt: at,
        updatedAt: at,
      });

      await standDown(kept);

      return kept;
    },

    change: async (id: string, change: QualityProfileChange): Promise<QualityProfile | null> => {
      const kept = await store.update(id, {
        ...Object.fromEntries(
          Object.entries(QualityProfileChangeSchema.parse(change)).filter(
            ([, value]) => value !== undefined,
          ),
        ),
        updatedAt: now().toISOString(),
      });

      if (kept === null) {
        return null;
      }

      await standDown(kept);

      return kept;
    },

    remove: (id: string): Promise<boolean> => store.remove(id),
  };
};

type ProfileService = ReturnType<typeof createProfileService>;

export type { ProfileService };

export { createProfileService };
