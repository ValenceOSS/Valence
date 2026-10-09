import type { z } from 'zod';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { saying } from '@ValenceI18n/saying';
import { randomUUID } from 'node:crypto';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import {
  MediaRequestArrivalsSchema,
  MediaRequestChangeSchema,
  MediaRequestDraftSchema,
  RELEASE_TYPES,
  RequestCatalogueSchema,
  RequestCatalogueUpdateSchema,
} from '@ValenceContracts/schemas/MediaRequest';
import { chooseProfile } from '@ValenceRequests/mediaRequests/chooseProfile';
import { itemFromDraft } from '@ValenceRequests/mediaRequests/itemFromDraft';
import { recordFromDraft } from '@ValenceRequests/mediaRequests/recordFromDraft';
import { highestSeasonOf } from '@ValenceRequests/mediaRequests/highestSeasonOf';
import { rebaseSeasons } from '@ValenceRequests/mediaRequests/rebaseSeasons';
import { seasonsChosen } from '@ValenceRequests/mediaRequests/seasonsChosen';
import { requestFactsOf } from '@ValenceRequests/mediaRequests/requestFactsOf';
import { showMediaRequest } from '@ValenceRequests/mediaRequests/showMediaRequest';
import { syncItems } from '@ValenceRequests/mediaRequests/syncItems';
import type {
  FollowedRequest,
  HeldInLibrary,
  MediaRequest,
  MediaRequestArrivals,
  MediaRequestArrived,
  MediaRequestChange,
  MediaRequestDraft,
  MediaRequestFollow,
  RequestCatalogue,
  RequestCatalogueDraft,
  RequestCatalogueUpdate,
  ReleaseType,
} from '@ValenceContracts/schemas/MediaRequest';
import type {
  MediaRequestRecord,
  MediaRequestStore,
} from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type {
  RequestItemRecord,
  RequestItemStore,
} from '@ValenceRequests/mediaRequests/RequestItemRecord';
import type { ProfileService } from '@ValenceRequests/profiles/createProfileService';

type CreateRequestServiceOptions = {
  requests: MediaRequestStore;
  items: RequestItemStore;
  profiles?: Pick<ProfileService, 'list'>;
  now?: () => Date;
  onChange?: () => void;
};

type Added = { request: MediaRequest; isNew: boolean };

const IN_FLIGHT = new Set<RequestItemRecord['state']>([
  'searching',
  'chosen',
  'downloading',
  'filing',
]);

const GONE_FROM_THE_LIBRARY = saying('common.noLongerInTheLibrary');

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
 * The seasons a series is asked for once a later ask is added to the request already kept for it:
 * the seasons of both, new seasons followed where either follows them, and the seasons the kept one
 * was following said against the catalogue now, so none of them is let go.
 *
 * @param kept - The request kept.
 * @param draft - What is asked now.
 * @returns The seasons, and how new ones are followed.
 */
const bothChoices = (
  kept: MediaRequestRecord,
  draft: Pick<
    z.infer<typeof MediaRequestDraftSchema>,
    'seasons' | 'followsNewSeasons' | 'catalogue'
  >,
): Pick<MediaRequestRecord, 'seasons' | 'followsNewSeasons' | 'followsAfter'> => {
  const base = rebaseSeasons(kept, draft.catalogue.episodes);

  return {
    seasons: bothSeasons(
      base.seasons,
      seasonsChosen(draft.seasons, draft.followsNewSeasons, draft.catalogue.episodes),
    ),
    followsNewSeasons: base.followsNewSeasons || draft.followsNewSeasons,
    followsAfter: base.followsAfter,
  };
};

/**
 * What a series request learns from what the library already holds of it: where the library keeps
 * it, and the item it is there as. Nothing for anything else, or where the library was not asked.
 *
 * @param kind - What the request is for.
 * @param held - What the library holds, where it was asked.
 * @returns The changes to the request.
 */
const keptBy = (
  kind: MediaRequestRecord['kind'],
  held: HeldInLibrary | null,
): Partial<Pick<MediaRequestRecord, 'libraryFolder' | 'seasonFolders' | 'mediaId'>> =>
  kind !== 'series' || held === null
    ? {}
    : {
        libraryFolder: held.folder,
        seasonFolders: held.seasonFolders,
        ...(held.mediaId === null ? {} : { mediaId: held.mediaId }),
      };

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
 * to date with the catalogue; trying again what failed; following or not following some of what it
 * waits for; and marking it arrived once the server has
 * found it in the library, whether filed by Valence, imported by a connected app or put there by
 * hand, and following it when the library loses it again. Episodes the library already holds when a
 * series is asked for, or brought up to date, are marked there rather than searched for.
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
    held: HeldInLibrary | null = null,
  ) => {
    const at = now().toISOString();
    const highest = record.kind === 'series' ? highestSeasonOf(catalogue.episodes) : null;
    const known =
      record.followsAfter === null && highest !== null
        ? ((await requests.update(record.id, { followsAfter: highest })) ?? record)
        : record;
    const { add, change, remove, arrive } = syncItems(
      known,
      catalogue,
      await itemsOf(record.id),
      chooseProfile(record, await profiles.list())?.releaseWait,
      held?.episodes ?? [],
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

    for (const id of arrive) {
      await items.update(id, {
        state: 'available',
        problem: null,
        problemCode: null,
        updatedAt: at,
      });
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
          ...(kept.kind === 'series' ? bothChoices(kept, draft) : { seasons: null }),
          ...(kept.kind === 'artist' && draft.releaseTypes !== null
            ? { releaseTypes: bothReleaseTypes(kept.releaseTypes, draft.releaseTypes) }
            : {}),
          ...(draft.profileId === null ? {} : { profileId: draft.profileId }),
          ...(draft.isPickedByHand ? { isPickedByHand: true } : {}),
          ...(draft.isApproved && kept.approval !== 'approved'
            ? { approval: 'approved', refusedBecause: null }
            : {}),
          ...keptBy(kept.kind, draft.held),
          catalogueCheckedAt: at,
          updatedAt: at,
        });
        const record = merged ?? kept;

        await sync(record, draft.catalogue, draft.held);
        onChange();

        return { request: await shown(record), isNew: false };
      }

      const record = await requests.insert(recordFromDraft(draft, randomUUID(), at));

      await sync(record, draft.catalogue, draft.held);
      onChange();

      return { request: await shown(record), isNew: true };
    },

    approve: (id: string): Promise<MediaRequest | null> =>
      changed(id, { approval: 'approved', refusedBecause: null }),

    refuse: (id: string, reason: string): Promise<MediaRequest | null> =>
      changed(id, {
        approval: 'refused',
        refusedBecause: reason.trim() === '' ? null : sayVerbatim(reason),
      }),

    change: async (
      id: string,
      asked: MediaRequestChange,
      given: RequestCatalogueDraft | null,
      held: HeldInLibrary | null = null,
    ): Promise<MediaRequest | null> => {
      const change = MediaRequestChangeSchema.parse(asked);
      const catalogue = given === null ? null : RequestCatalogueSchema.parse(given);
      const kept = await requests.find(id);

      if (kept === null) {
        return null;
      }

      const choosesSeasons =
        kept.kind === 'series' &&
        (change.seasons !== undefined || change.followsNewSeasons !== undefined);
      const base = catalogue === null ? kept : rebaseSeasons(kept, catalogue.episodes);
      const record = await requests.update(id, {
        ...(choosesSeasons
          ? {
              seasons:
                change.seasons === undefined
                  ? base.seasons
                  : seasonsChosen(
                      change.seasons,
                      change.followsNewSeasons ?? base.followsNewSeasons,
                      catalogue?.episodes ?? [],
                    ),
              followsNewSeasons: change.followsNewSeasons ?? base.followsNewSeasons,
              followsAfter: base.followsAfter,
            }
          : {}),
        ...(change.releaseTypes === undefined ? {} : { releaseTypes: change.releaseTypes }),
        ...(change.profileId === undefined ? {} : { profileId: change.profileId }),
        ...(change.isPickedByHand === undefined ? {} : { isPickedByHand: change.isPickedByHand }),
        ...(change.libraryId === undefined ? {} : { libraryId: change.libraryId }),
        ...(change.libraryPath === undefined ? {} : { libraryPath: change.libraryPath }),
        ...(catalogue === null ? {} : requestFactsOf(catalogue)),
        ...keptBy(kept.kind, held),
        updatedAt: now().toISOString(),
      });

      if (record === null) {
        return null;
      }

      if (record.kind === 'film' || catalogue !== null) {
        await sync(record, catalogue ?? { episodes: [], albums: [] }, held);
      }

      onChange();

      return shown(record);
    },

    updateCatalogue: async (
      id: string,
      update: RequestCatalogueUpdate,
    ): Promise<MediaRequest | null> => {
      const { catalogue, held, libraryPath } = RequestCatalogueUpdateSchema.parse(update);
      const at = now().toISOString();
      const kept = await requests.find(id);

      if (kept === null) {
        return null;
      }

      const record = await requests.update(id, {
        ...requestFactsOf(catalogue),
        ...(libraryPath === undefined ? {} : { libraryPath }),
        ...keptBy(kept.kind, held),
        catalogueCheckedAt: at,
        updatedAt: at,
      });

      if (record === null) {
        return null;
      }

      await sync(record, catalogue, held);
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

    follow: async (id: string, following: MediaRequestFollow): Promise<MediaRequest | null> => {
      const record = await requests.find(id);

      if (record === null) {
        return null;
      }

      const at = now().toISOString();
      const asked = new Set(following.itemIds);

      for (const item of await itemsOf(id)) {
        if (asked.has(item.id) && item.isFollowed !== following.isFollowed) {
          await items.update(item.id, {
            isFollowed: following.isFollowed,
            ...(following.isFollowed ? { lastSearchedAt: null } : {}),
            updatedAt: at,
          });
        }
      }

      return changed(id, {});
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

    arrived: async (id: string, mediaId: string): Promise<MediaRequestArrived | null> => {
      const at = now().toISOString();
      const filed = (await itemsOf(id)).filter((item) => item.state === 'filed');

      for (const item of filed) {
        await items.update(item.id, { state: 'available', problem: null, updatedAt: at });
      }

      const shownNow = await changed(id, { mediaId });

      return shownNow === null ? null : { request: shownNow, newlyAvailable: filed.length };
    },

    arrivedInLibrary: async (
      id: string,
      asked: MediaRequestArrivals,
    ): Promise<MediaRequestArrived | null> => {
      const arrivals = MediaRequestArrivalsSchema.parse(asked);
      const record = await requests.find(id);

      if (record === null) {
        return null;
      }

      const isHeld = (item: RequestItemRecord): boolean => {
        if (item.musicBrainzId !== null) {
          return (arrivals.albums ?? []).includes(item.musicBrainzId);
        }

        return item.season === null
          ? arrivals.episodes === null
          : (arrivals.episodes ?? []).some(
              (held) => held.season === item.season && held.episode === item.episode,
            );
      };
      const arriving = (await itemsOf(id)).filter(
        (item) =>
          item.state !== 'available' &&
          (record.handOff !== null || !IN_FLIGHT.has(item.state)) &&
          isHeld(item),
      );
      const at = now().toISOString();

      for (const item of arriving) {
        await items.update(item.id, {
          state: 'available',
          problem: null,
          problemCode: null,
          updatedAt: at,
        });
      }

      const shownNow =
        arriving.length === 0 && record.mediaId !== null
          ? await shown(record)
          : await changed(id, { mediaId: arrivals.mediaId });

      return shownNow === null ? null : { request: shownNow, newlyAvailable: arriving.length };
    },

    left: async (id: string, mediaId: string | null): Promise<MediaRequest | null> => {
      if (mediaId !== null) {
        return changed(id, { mediaId });
      }

      const at = now().toISOString();

      for (const item of await itemsOf(id)) {
        if (item.state === 'available') {
          await items.update(item.id, {
            state: 'failed',
            problem: GONE_FROM_THE_LIBRARY,
            problemCode: null,
            updatedAt: at,
          });
        }
      }

      return changed(id, { mediaId: null });
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
