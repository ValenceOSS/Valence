import { randomUUID } from 'node:crypto';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import {
  MediaRequestChangeSchema,
  MediaRequestDraftSchema,
  RELEASE_TYPES,
  RequestCatalogueSchema,
} from '@ValenceContracts/schemas/MediaRequest';
import { chooseProfile } from '@ValenceRequests/mediaRequests/chooseProfile';
import { itemFromDraft } from '@ValenceRequests/mediaRequests/itemFromDraft';
import { recordFromDraft } from '@ValenceRequests/mediaRequests/recordFromDraft';
import { requestFactsOf } from '@ValenceRequests/mediaRequests/requestFactsOf';
import { showMediaRequest } from '@ValenceRequests/mediaRequests/showMediaRequest';
import { syncItems } from '@ValenceRequests/mediaRequests/syncItems';
import type {
  FollowedRequest,
  MediaRequest,
  MediaRequestChange,
  MediaRequestDraft,
  RequestCatalogue,
  RequestCatalogueDraft,
  RequestCatalogueUpdate,
  ReleaseType,
} from '@ValenceContracts/schemas/MediaRequest';
import type {
  MediaRequestRecord,
  MediaRequestStore,
} from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemStore } from '@ValenceRequests/mediaRequests/RequestItemRecord';
import type { ProfileService } from '@ValenceRequests/profiles/createProfileService';

type CreateRequestServiceOptions = {
  requests: MediaRequestStore;
  items: RequestItemStore;
  profiles?: Pick<ProfileService, 'list'>;
  now?: () => Date;
  onChange?: () => void;
};

type Added = { request: MediaRequest; isNew: boolean };

/**
 * Seasons asked for by two requests for the same series: every season where either asked for every
 * one, and otherwise both lists together.
 *
 * @param kept - What was asked before.
 * @param asked - What is asked now.
 * @returns The seasons.
 */
const bothSeasons = (kept: number[] | null, asked: number[] | null): number[] | null =>
  kept === null || asked === null
    ? null
    : [...new Set([...kept, ...asked])].toSorted((left, right) => left - right);

/**
 * The kinds of release two requests for the same artist watch for: both lists together, in the
 * order they are offered.
 *
 * @param kept - What was asked before.
 * @param asked - What is asked now.
 * @returns The kinds.
 */
const bothReleaseTypes = (kept: ReleaseType[] | null, asked: ReleaseType[]): ReleaseType[] =>
  RELEASE_TYPES.filter((type) => (kept ?? []).includes(type) || asked.includes(type));

/**
 * Keeps the requests for films and series and what each waits for: making one, or adding to one
 * already made for the same title; approving and refusing; changing what it asks for; bringing it up
 * to date with the catalogue; trying again what failed; and marking it arrived once the server has
 * found it in the library.
 *
 * Whatever changes what there is to fetch is said, so whatever fetches can get on with it.
 *
 * @param requests - Where requests are kept.
 * @param items - Where what each waits for is kept.
 * @param profiles - The quality profiles, which say how long a film is held.
 * @param now - The clock.
 * @param onChange - Told when there may be something new to fetch.
 * @returns The service.
 */
const createRequestService = ({
  requests,
  items,
  profiles = { list: () => Promise.resolve([]) },
  now = () => new Date(),
  onChange = () => undefined,
}: CreateRequestServiceOptions) => {
  const itemsOf = async (id: string) =>
    (await items.list()).filter((item) => item.requestId === id);

  const shown = async (record: MediaRequestRecord) =>
    showMediaRequest(
      record,
      await itemsOf(record.id),
      chooseProfile(record, await profiles.list())?.name ?? null,
    );

  const sync = async (
    record: MediaRequestRecord,
    catalogue: Pick<RequestCatalogue, 'episodes' | 'albums'>,
  ) => {
    const at = now().toISOString();
    const { add, change, remove } = syncItems(
      record,
      catalogue,
      await itemsOf(record.id),
      chooseProfile(record, await profiles.list())?.releaseWait,
    );

    for (const draft of add) {
      await items.insert(itemFromDraft(draft, randomUUID(), record.id, at));
    }

    for (const { id, changes } of change) {
      await items.update(id, { ...changes, updatedAt: at });
    }

    for (const id of remove) {
      await items.remove(id);
    }
  };

  const changed = async (id: string, changes: Partial<Omit<MediaRequestRecord, 'id'>>) => {
    const updated = await requests.update(id, { ...changes, updatedAt: now().toISOString() });

    onChange();

    return updated === null ? null : shown(updated);
  };

  return {
    list: async (): Promise<MediaRequest[]> => {
      const [kept, waiting, judging] = await Promise.all([
        requests.list(),
        items.list(),
        profiles.list(),
      ]);

      return kept
        .toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map((record) =>
          showMediaRequest(
            record,
            waiting.filter((item) => item.requestId === record.id),
            chooseProfile(record, judging)?.name ?? null,
          ),
        );
    },

    find: async (id: string): Promise<MediaRequest | null> => {
      const record = await requests.find(id);

      return record === null ? null : shown(record);
    },

    add: async (asked: MediaRequestDraft): Promise<Added> => {
      const draft = MediaRequestDraftSchema.parse(asked);
      const at = now().toISOString();
      const kept = (await requests.list()).find(
        (record) =>
          record.kind === draft.kind &&
          (isBookRequest(draft.kind)
            ? record.openLibraryId === draft.openLibraryId
            : isMusicRequest(draft.kind)
              ? record.musicBrainzId === draft.musicBrainzId
              : record.tmdbId === draft.tmdbId),
      );

      if (kept !== undefined) {
        const merged = await requests.update(kept.id, {
          ...requestFactsOf(draft.catalogue),
          seasons: kept.kind === 'series' ? bothSeasons(kept.seasons, draft.seasons) : null,
          ...(kept.kind === 'artist' && draft.releaseTypes !== null
            ? { releaseTypes: bothReleaseTypes(kept.releaseTypes, draft.releaseTypes) }
            : {}),
          ...(draft.profileId === null ? {} : { profileId: draft.profileId }),
          ...(draft.isPickedByHand ? { isPickedByHand: true } : {}),
          ...(draft.isApproved && kept.approval !== 'approved'
            ? { approval: 'approved', refusedBecause: null }
            : {}),
          catalogueCheckedAt: at,
          updatedAt: at,
        });
        const record = merged ?? kept;

        await sync(record, draft.catalogue);
        onChange();

        return { request: await shown(record), isNew: false };
      }

      const record = await requests.insert(recordFromDraft(draft, randomUUID(), at));

      await sync(record, draft.catalogue);
      onChange();

      return { request: await shown(record), isNew: true };
    },

    approve: (id: string): Promise<MediaRequest | null> =>
      changed(id, { approval: 'approved', refusedBecause: null }),

    refuse: (id: string, reason: string): Promise<MediaRequest | null> =>
      changed(id, { approval: 'refused', refusedBecause: reason.trim() === '' ? null : reason }),

    change: async (
      id: string,
      asked: MediaRequestChange,
      given: RequestCatalogueDraft | null,
    ): Promise<MediaRequest | null> => {
      const change = MediaRequestChangeSchema.parse(asked);
      const catalogue = given === null ? null : RequestCatalogueSchema.parse(given);
      const record = await requests.update(id, {
        ...(change.seasons === undefined ? {} : { seasons: change.seasons }),
        ...(change.releaseTypes === undefined ? {} : { releaseTypes: change.releaseTypes }),
        ...(change.profileId === undefined ? {} : { profileId: change.profileId }),
        ...(change.isPickedByHand === undefined ? {} : { isPickedByHand: change.isPickedByHand }),
        ...(change.libraryId === undefined ? {} : { libraryId: change.libraryId }),
        ...(change.libraryPath === undefined ? {} : { libraryPath: change.libraryPath }),
        ...(catalogue === null ? {} : requestFactsOf(catalogue)),
        updatedAt: now().toISOString(),
      });

      if (record === null) {
        return null;
      }

      if (record.kind === 'film' || catalogue !== null) {
        await sync(record, catalogue ?? { episodes: [], albums: [] });
      }

      onChange();

      return shown(record);
    },

    updateCatalogue: async (
      id: string,
      update: RequestCatalogueUpdate,
    ): Promise<MediaRequest | null> => {
      const catalogue = RequestCatalogueSchema.parse(update.catalogue);
      const at = now().toISOString();
      const record = await requests.update(id, {
        ...requestFactsOf(catalogue),
        ...(update.libraryPath === undefined ? {} : { libraryPath: update.libraryPath }),
        catalogueCheckedAt: at,
        updatedAt: at,
      });

      if (record === null) {
        return null;
      }

      await sync(record, catalogue);
      onChange();

      return shown(record);
    },

    following: async (): Promise<FollowedRequest[]> => {
      const [kept, waiting] = await Promise.all([requests.list(), items.list()]);

      return kept
        .filter(
          (record) =>
            record.approval !== 'refused' &&
            (record.kind === 'series' || record.kind === 'artist'
              ? !record.isEnded
              : waiting.some(
                  (item) =>
                    item.requestId === record.id &&
                    (item.state === 'waiting' || item.state === 'wanted'),
                )),
        )
        .map(({ id, kind, tmdbId, musicBrainzId, openLibraryId, libraryId }) => ({
          id,
          kind,
          tmdbId,
          musicBrainzId,
          openLibraryId,
          libraryId,
        }));
    },

    retry: async (id: string): Promise<MediaRequest | null> => {
      const record = await requests.find(id);

      if (record === null) {
        return null;
      }

      const at = now().toISOString();

      for (const item of await itemsOf(id)) {
        if (item.state === 'failed' || item.state === 'wanted') {
          await items.update(item.id, {
            state: 'wanted',
            problem: null,
            attempts: 0,
            lastSearchedAt: null,
            updatedAt: at,
          });
        }
      }

      return changed(id, { problem: null });
    },

    fulfil: async (id: string): Promise<MediaRequest | null> => {
      const at = now().toISOString();

      for (const item of await itemsOf(id)) {
        if (item.state !== 'available') {
          await items.update(item.id, {
            state: 'available',
            problem: null,
            updatedAt: at,
          });
        }
      }

      return changed(id, { problem: null });
    },

    arrived: async (id: string, mediaId: string): Promise<MediaRequest | null> => {
      const at = now().toISOString();

      for (const item of await itemsOf(id)) {
        if (item.state === 'filed') {
          await items.update(item.id, { state: 'available', problem: null, updatedAt: at });
        }
      }

      return changed(id, { mediaId });
    },

    remove: async (id: string): Promise<boolean> => {
      for (const item of await itemsOf(id)) {
        await items.remove(item.id);
      }

      return requests.remove(id);
    },
  };
};

type RequestService = ReturnType<typeof createRequestService>;

export type { RequestService };

export { createRequestService };
