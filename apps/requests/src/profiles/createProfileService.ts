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
 * Keeps the quality profiles searches are judged against, in the order the operator puts them in,
 * highest first: a new profile goes to the bottom until it is placed, and removing one closes the
 * gap.
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
  const listed = async (): Promise<QualityProfile[]> =>
    (await store.list()).toSorted(
      (left, right) => left.position - right.position || left.name.localeCompare(right.name),
    );

  const place = async (ids: readonly string[]): Promise<QualityProfile[]> => {
    const kept = await listed();
    const named = ids.flatMap((id) => kept.filter((profile) => profile.id === id));
    const placed = [...named, ...kept.filter((profile) => !ids.includes(profile.id))];
    const at = now().toISOString();

    for (const [position, profile] of placed.entries()) {
      if (profile.position !== position) {
        await store.update(profile.id, { position, updatedAt: at });
      }
    }

    return listed();
  };

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
    list: listed,

    reorder: (ids: readonly string[]): Promise<QualityProfile[]> => place(ids),

    find: (id: string): Promise<QualityProfile | null> => store.find(id),

    add: async (draft: QualityProfileDraft): Promise<QualityProfile> => {
      const at = now().toISOString();
      const others = await store.list();
      const kept = await store.insert({
        ...QualityProfileDraftSchema.parse(draft),
        position: Math.max(-1, ...others.map((profile) => profile.position)) + 1,
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

    remove: async (id: string): Promise<boolean> => {
      if (!(await store.remove(id))) {
        return false;
      }

      await place([]);

      return true;
    },
  };
};

type ProfileService = ReturnType<typeof createProfileService>;

export type { ProfileService };

export { createProfileService };
