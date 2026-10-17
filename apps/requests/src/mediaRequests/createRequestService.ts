import { isSameAsker } from '@ValenceContracts/functions/isSameAsker';
import type { z } from 'zod';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { saying } from '@ValenceI18n/saying';
import { randomUUID } from 'node:crypto';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import {
  BOOK_FORMATS,
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
import { booksFollowed } from '@ValenceRequests/mediaRequests/booksFollowed';
import { narrationOfSeriesBook } from '@ValenceRequests/mediaRequests/narrationOfSeriesBook';
import { seriesBookDraft } from '@ValenceRequests/mediaRequests/seriesBookDraft';
import { episodesByChoice } from '@ValenceContracts/functions/episodesByChoice';
import { isItemInScope } from '@ValenceRequests/mediaRequests/isItemInScope';
import { coursRechosen } from '@ValenceRequests/mediaRequests/coursRechosen';
import { isSeasonWanted } from '@ValenceRequests/mediaRequests/isSeasonWanted';
import { profileChangeOf } from '@ValenceRequests/mediaRequests/profileChangeOf';
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
  ProfileAskDecision,
  AskerNames,
  AskingProfile,
  Requester,
  RequestOrigin,
  SearchScope,
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
  const chosenAmong = episodesByChoice(draft.catalogue);
  const base = rebaseSeasons(kept, chosenAmong);

  return {
    seasons: bothSeasons(
      base.seasons,
      seasonsChosen(draft.seasons, draft.followsNewSeasons, chosenAmong),
    ),
    followsNewSeasons: base.followsNewSeasons || draft.followsNewSeasons,
    followsAfter: base.followsAfter,
  };
};

/**
 * The first person to ask for a request, as an asker.
 *
 * @param kept - The request kept.
 * @returns Who asked first.
 */
const firstAskerOf = (kept: MediaRequestRecord): Requester => ({
  id: kept.requestedById,
  name: kept.requestedByName,
  askingProfile: kept.requestedByProfile ?? null,
});

/**
 * Somebody asking for what is already asked for: kept among those who asked, unless they are already.
 *
 * @param kept - The request kept.
 * @param asker - Who is asking.
 * @returns The change to the request, if any.
 */
const joinedBy = (kept: MediaRequestRecord, asker: Requester): Partial<MediaRequestRecord> =>
  isSameAsker(firstAskerOf(kept), asker) || kept.alsoAskedBy.some((one) => isSameAsker(one, asker))
    ? {}
    : { alsoAskedBy: [...kept.alsoAskedBy, asker] };

/**
 * Somebody asking for a title, as it changes the request kept for it. Following a title changes
 * nothing of who asked, and keeps it followed however those who asked come and go; somebody asking
 * for a title only followed until now becomes the one who asked for it, as though they were the
 * first; and anybody else asking joins those who asked.
 *
 * @param kept - The request kept.
 * @param asker - Who is asking.
 * @param origin - Whether they asked for it or only follow it.
 * @returns The change to the request, if any.
 */
const askedBy = (
  kept: MediaRequestRecord,
  asker: Requester,
  origin: RequestOrigin,
): Partial<MediaRequestRecord> => {
  if (origin === 'monitored') {
    return { isFollowed: true };
  }

  return kept.origin === 'monitored'
    ? {
        origin: 'asked',
        requestedById: asker.id,
        requestedByName: asker.name,
        requestedByProfile: asker.askingProfile ?? null,
        alsoAskedBy: [],
      }
    : joinedBy(kept, asker);
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

  const itemsShownFor = (
    record: MediaRequestRecord,
    every: readonly MediaRequestRecord[],
    waiting: readonly RequestItemRecord[],
  ): RequestItemRecord[] => {
    const books =
      record.kind === 'bookSeries'
        ? new Set(every.filter((one) => one.seriesRequestId === record.id).map((one) => one.id))
        : new Set([record.id]);

    return waiting.filter((item) => books.has(item.requestId));
  };

  const shown = async (record: MediaRequestRecord) =>
    showMediaRequest(
      record,
      record.kind === 'bookSeries'
        ? itemsShownFor(record, await requests.list(), await items.list())
        : await itemsOf(record.id),
      chooseProfile(record, await profiles.list())?.name ?? null,
    );

  const sync = async (
    record: MediaRequestRecord,
    catalogue: Pick<RequestCatalogue, 'episodes' | 'albums' | 'anime'>,
    held: HeldInLibrary | null = null,
  ) => {
    const at = now().toISOString();
    const highest = record.kind === 'series' ? highestSeasonOf(episodesByChoice(catalogue)) : null;
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
      held?.albums ?? [],
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
        heldQuality: null,
        problem: null,
        problemCode: null,
        updatedAt: at,
      });
    }
  };

  /**
   * Follows the episodes of each season a series is newly asked for and stops following those of
   * each season it no longer is, as switching the season itself would, so what is already fetched
   * or on its way is left alone rather than searched for or upgraded.
   *
   * @param before - The request as it was.
   * @param after - The request as it is now.
   */
  const followChosenSeasons = async (
    before: Pick<MediaRequestRecord, 'seasons' | 'followsNewSeasons' | 'followsAfter'>,
    after: MediaRequestRecord,
  ) => {
    const at = now().toISOString();

    for (const item of await itemsOf(after.id)) {
      if (item.season === null) {
        continue;
      }

      const chosenBy = item.cour ?? item.season;
      const isWanted = isSeasonWanted(after, chosenBy);

      if (isWanted !== isSeasonWanted(before, chosenBy) && item.isFollowed !== isWanted) {
        await items.update(item.id, {
          isFollowed: isWanted,
          ...(isWanted ? { lastSearchedAt: null } : {}),
          updatedAt: at,
        });
      }
    }
  };

  /**
   * Asks for each book a series request follows that is not asked for yet, as a book request of
   * its own in the series' formats, with the narration that settles itself, and ties each book
   * already asked for to the series; nothing for any other request.
   *
   * @param series - The request.
   */
  const followSeries = async (series: MediaRequestRecord): Promise<void> => {
    if (series.kind !== 'bookSeries' || series.approval === 'refused') {
      return;
    }

    for (const book of booksFollowed(series)) {
      const every = await requests.list();
      const asked = every.find(
        (record) => record.kind === 'book' && record.openLibraryId === book.openLibraryId,
      );

      if (asked !== undefined) {
        if ((asked.seriesRequestId ?? null) === null) {
          await requests.update(asked.id, {
            seriesRequestId: series.id,
            updatedAt: now().toISOString(),
          });
        }

        continue;
      }

      const chosenReaders = every
        .filter((record) => record.seriesRequestId === series.id)
        .flatMap((record) =>
          (record.narrationsWanted ?? []).flatMap((asin) => {
            const narration = (record.narrations ?? []).find((one) => one.asin === asin);

            return narration === undefined ? [] : [narration.narrators];
          }),
        );
      const narration = narrationOfSeriesBook(
        book,
        series.seriesNarrators ?? [],
        chosenReaders,
        series.keepsOneNarrator ?? false,
      );
      const draft = seriesBookDraft(series, book, narration === null ? null : [narration]);

      if (draft !== null) {
        const added = await addRequest(draft);

        await requests.update(added.request.id, {
          seriesRequestId: series.id,
          updatedAt: now().toISOString(),
        });
      }
    }
  };

  /**
   * Keeps a request for what was asked, or joins the request already kept for the same title, and
   * for a series asks for each of its books.
   *
   * @param asked - What was asked, as the server drafted it.
   * @returns The request, and whether it is new.
   */
  const addRequest = async (asked: MediaRequestDraft): Promise<Added> => {
    const draft = MediaRequestDraftSchema.parse(asked);
    const at = now().toISOString();
    const every = await profiles.list();
    const askedAt = every.find((profile) => profile.id === draft.profileId) ?? null;
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
        ...(kept.kind === 'bookSeries'
          ? {
              companionsWanted: [
                ...new Set([...(kept.companionsWanted ?? []), ...draft.companionsWanted]),
              ],
              keepsOneNarrator: (kept.keepsOneNarrator ?? false) || draft.keepsOneNarrator,
            }
          : {}),
        ...(kept.kind === 'book' || kept.kind === 'bookSeries'
          ? {
              bookFormats: BOOK_FORMATS.filter(
                (format) =>
                  (kept.bookFormats ?? ['ebook']).includes(format) ||
                  draft.bookFormats.includes(format),
              ),
            }
          : {}),
        ...profileChangeOf(kept, draft, every),
        ...(draft.isPickedByHand ? { isPickedByHand: true } : {}),
        ...(draft.isApproved &&
        kept.approval !== 'approved' &&
        kept.requestedById === draft.requestedBy.id
          ? { approval: 'approved', refusedBecause: null }
          : {}),
        ...askedBy(
          kept,
          {
            ...draft.requestedBy,
            ...(askedAt === null ? {} : { profileId: askedAt.id, profileName: askedAt.name }),
          },
          draft.origin,
        ),
        ...keptBy(kept.kind, draft.held),
        catalogueCheckedAt: at,
        updatedAt: at,
      });
      const record = merged ?? kept;

      await sync(record, draft.catalogue, draft.held);
      await followSeries(record);
      onChange();

      return { request: await shown(record), isNew: false };
    }

    const record = await requests.insert(recordFromDraft(draft, randomUUID(), at));

    await sync(record, draft.catalogue, draft.held);
    await followSeries(record);
    onChange();

    return { request: await shown(record), isNew: true };
  };

  /**
   * Makes the same change to every book a series request asked for, as it was asked for with it.
   *
   * @param id - The series request.
   * @param changes - The change.
   */
  const alongItsBooks = async (
    id: string,
    changes: Partial<Omit<MediaRequestRecord, 'id'>>,
  ): Promise<void> => {
    for (const book of (await requests.list()).filter((one) => one.seriesRequestId === id)) {
      await requests.update(book.id, { ...changes, updatedAt: now().toISOString() });
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
            itemsShownFor(record, kept, waiting),
            chooseProfile(record, judging)?.name ?? null,
          ),
        );
    },

    find: async (id: string): Promise<MediaRequest | null> => {
      const record = await requests.find(id);

      return record === null ? null : shown(record);
    },

    add: (asked: MediaRequestDraft): Promise<Added> => addRequest(asked),

    join: async (id: string, asker: Requester): Promise<MediaRequest | null> => {
      const kept = await requests.find(id);

      if (kept === null) {
        return null;
      }

      const record = await requests.update(id, {
        ...askedBy(kept, asker, 'asked'),
        updatedAt: now().toISOString(),
      });

      onChange();

      return record === null ? null : shown(record);
    },

    leave: async (
      id: string,
      leaving: Pick<Requester, 'id' | 'askingProfile'>,
    ): Promise<MediaRequest | null> => {
      const kept = await requests.find(id);

      if (kept === null || kept.origin === 'monitored') {
        return null;
      }

      const [next, ...rest] = kept.alsoAskedBy;
      const isFirst = isSameAsker(firstAskerOf(kept), leaving);
      const isLast = isFirst && next === undefined;

      if (
        (isLast && !kept.isFollowed) ||
        (!isFirst && !kept.alsoAskedBy.some((one) => isSameAsker(one, leaving)))
      ) {
        return null;
      }

      const record = await requests.update(id, {
        ...(isLast
          ? { origin: 'monitored' }
          : isFirst && next !== undefined
            ? {
                requestedById: next.id,
                requestedByName: next.name,
                requestedByProfile: next.askingProfile ?? null,
                alsoAskedBy: rest,
              }
            : { alsoAskedBy: kept.alsoAskedBy.filter((one) => !isSameAsker(one, leaving)) }),
        updatedAt: now().toISOString(),
      });

      onChange();

      return record === null ? null : shown(record);
    },

    renameAskers: async (
      askers: AskerNames['askers'],
      profiles: AskerNames['profiles'] = [],
    ): Promise<number> => {
      const names = new Map(askers.map((asker) => [asker.id, asker.name]));
      const profileNames = new Map(profiles.map((profile) => [profile.profileId, profile.name]));
      const renamedProfile = (asking: AskingProfile | null): AskingProfile | null => {
        const name = asking === null ? undefined : profileNames.get(asking.profileId);

        if (asking !== null && name === undefined && profileNames.size > 0) {
          return null;
        }

        return asking === null || name === undefined || name === asking.name
          ? asking
          : { ...asking, name };
      };
      const renamed = (asker: Requester): Requester => {
        const name = names.get(asker.id) ?? asker.name;
        const asking = asker.askingProfile ?? null;
        const askingProfile = renamedProfile(asking);

        return name === asker.name && askingProfile === asking
          ? asker
          : { ...asker, name, askingProfile };
      };
      let changed = 0;

      for (const kept of await requests.list()) {
        const requestedByName = names.get(kept.requestedById) ?? kept.requestedByName;
        const requestedByProfile = renamedProfile(kept.requestedByProfile ?? null);
        const alsoAskedBy = kept.alsoAskedBy.map(renamed);
        const ask = kept.profileAsk ?? null;
        const askedFor = ask === null ? null : { ...ask, asker: renamed(ask.asker) };
        const changes = {
          ...(requestedByName === kept.requestedByName ? {} : { requestedByName }),
          ...(requestedByProfile === (kept.requestedByProfile ?? null)
            ? {}
            : { requestedByProfile }),
          ...(alsoAskedBy.every((asker, at) => asker === kept.alsoAskedBy[at])
            ? {}
            : { alsoAskedBy }),
          ...(askedFor === null || askedFor.asker === ask?.asker ? {} : { profileAsk: askedFor }),
        };

        if (Object.keys(changes).length > 0) {
          await requests.update(kept.id, changes);
          changed += 1;
        }
      }

      if (changed > 0) {
        onChange();
      }

      return changed;
    },

    decideNarration: async (id: string, asins: readonly string[]): Promise<MediaRequest | null> => {
      const kept = await requests.find(id);
      const known = new Set((kept?.narrations ?? []).map((narration) => narration.asin));

      if (kept === null || kept.kind !== 'book' || !asins.every((asin) => known.has(asin))) {
        return null;
      }

      const record = await requests.update(id, {
        narrationsWanted: [...asins],
        updatedAt: now().toISOString(),
      });

      if (record === null) {
        return null;
      }

      await sync(record, { episodes: [], albums: [] });
      onChange();

      return shown(record);
    },

    decideProfileAsk: async (
      id: string,
      decision: ProfileAskDecision,
    ): Promise<MediaRequest | null> => {
      const kept = await requests.find(id);

      if (kept?.profileAsk === null || kept?.profileAsk === undefined) {
        return null;
      }

      const asked = kept.profileAsk.profileId;
      const record = await requests.update(id, {
        ...(decision.choice === 'switch' ? { profileId: asked } : {}),
        ...(decision.choice === 'both' && !(kept.versions ?? []).includes(asked)
          ? { versions: [...(kept.versions ?? []), asked] }
          : {}),
        profileAsk: null,
        updatedAt: now().toISOString(),
      });

      if (record === null) {
        return null;
      }

      if (decision.choice === 'both') {
        await sync(record, { episodes: [], albums: [] }, null);
      }

      onChange();

      return shown(record);
    },

    approve: async (id: string): Promise<MediaRequest | null> => {
      await alongItsBooks(id, { approval: 'approved', refusedBecause: null });

      const approved = await changed(id, { approval: 'approved', refusedBecause: null });
      const record = await requests.find(id);

      if (record !== null) {
        await followSeries(record);
      }

      return approved;
    },

    refuse: async (id: string, reason: string): Promise<MediaRequest | null> => {
      const refusal = {
        approval: 'refused' as const,
        refusedBecause: reason.trim() === '' ? null : sayVerbatim(reason),
      };

      await alongItsBooks(id, refusal);

      return changed(id, refusal);
    },

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
      const base = catalogue === null ? kept : rebaseSeasons(kept, episodesByChoice(catalogue));
      const rechosen =
        change.courOrder === undefined ||
        choosesSeasons ||
        catalogue?.anime === undefined ||
        catalogue.anime === null
          ? null
          : coursRechosen(kept, catalogue.anime);
      const record = await requests.update(id, {
        ...rechosen,
        ...(choosesSeasons
          ? {
              seasons:
                change.seasons === undefined
                  ? base.seasons
                  : seasonsChosen(
                      change.seasons,
                      change.followsNewSeasons ?? base.followsNewSeasons,
                      catalogue === null ? [] : episodesByChoice(catalogue),
                    ),
              followsNewSeasons: change.followsNewSeasons ?? base.followsNewSeasons,
              followsAfter: base.followsAfter,
            }
          : {}),
        ...(change.releaseTypes === undefined ? {} : { releaseTypes: change.releaseTypes }),
        ...(change.upgradesToLossless === undefined || !isMusicRequest(kept.kind)
          ? {}
          : { upgradesToLossless: change.upgradesToLossless }),
        ...(change.bookFormats === undefined || (kept.kind !== 'book' && kept.kind !== 'bookSeries')
          ? {}
          : { bookFormats: change.bookFormats }),
        ...(change.companionsWanted === undefined || kept.kind !== 'bookSeries'
          ? {}
          : { companionsWanted: change.companionsWanted }),
        ...(change.keepsOneNarrator === undefined || kept.kind !== 'bookSeries'
          ? {}
          : { keepsOneNarrator: change.keepsOneNarrator }),
        ...(change.followsNewSeasons === undefined || kept.kind !== 'bookSeries'
          ? {}
          : { followsNewSeasons: change.followsNewSeasons }),
        ...(change.profileId === undefined ? {} : { profileId: change.profileId }),
        ...(change.isPickedByHand === undefined ? {} : { isPickedByHand: change.isPickedByHand }),
        ...(change.libraryId === undefined ? {} : { libraryId: change.libraryId }),
        ...(change.libraryPath === undefined ? {} : { libraryPath: change.libraryPath }),
        ...(change.animeAudio === undefined ? {} : { animeAudio: change.animeAudio }),
        ...(change.preferredGroup === undefined ? {} : { preferredGroup: change.preferredGroup }),
        ...(change.courOrder === undefined ? {} : { courOrder: change.courOrder }),
        ...(change.indexerIds === undefined ? {} : { indexerIds: change.indexerIds }),
        ...(catalogue === null ? {} : requestFactsOf(catalogue)),
        ...keptBy(kept.kind, held),
        updatedAt: now().toISOString(),
      });

      if (record === null) {
        return null;
      }

      if (record.kind === 'film' || record.kind === 'book' || catalogue !== null) {
        await sync(record, catalogue ?? { episodes: [], albums: [] }, held);
      }

      if (choosesSeasons) {
        await followChosenSeasons(base, (await requests.find(id)) ?? record);
      }

      if (record.kind === 'bookSeries') {
        if (change.bookFormats !== undefined) {
          for (const book of (await requests.list()).filter(
            (one) => one.seriesRequestId === record.id,
          )) {
            const updated = await requests.update(book.id, {
              bookFormats: change.bookFormats,
              updatedAt: now().toISOString(),
            });

            if (updated !== null) {
              await sync(updated, { episodes: [], albums: [] });
            }
          }
        }

        await followSeries(record);
      }

      if (rechosen !== null && (kept.anime ?? null) !== null) {
        const wantedBefore = new Set(
          (kept.anime?.episodes ?? [])
            .filter((one) => isSeasonWanted(kept, one.cour))
            .map((one) => `${one.season.toString()}x${one.episode.toString()}`),
        );

        for (const item of await itemsOf(id)) {
          const key = `${(item.season ?? -1).toString()}x${(item.episode ?? -1).toString()}`;

          if (
            item.isFollowed &&
            !wantedBefore.has(key) &&
            (item.state === 'waiting' || item.state === 'wanted')
          ) {
            await items.update(item.id, { isFollowed: false, updatedAt: now().toISOString() });
          }
        }
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

      if (record.followsNewSeasons) {
        await followSeries(record);
      }

      onChange();

      return shown(record);
    },

    following: async (): Promise<FollowedRequest[]> => {
      const [kept, waiting] = await Promise.all([requests.list(), items.list()]);
      const isStillWanting = (record: MediaRequestRecord) =>
        waiting.some(
          (item) =>
            item.requestId === record.id && (item.state === 'waiting' || item.state === 'wanted'),
        );

      return kept
        .filter(
          (record) =>
            record.approval !== 'refused' &&
            (record.kind === 'series' || record.kind === 'artist'
              ? !record.isEnded || isStillWanting(record)
              : record.kind === 'bookSeries'
                ? record.followsNewSeasons
                : isStillWanting(record)),
        )
        .map(
          ({
            id,
            kind,
            tmdbId,
            musicBrainzId,
            openLibraryId,
            seriesAsin,
            libraryId,
            courOrder,
          }) => ({
            id,
            kind,
            tmdbId,
            musicBrainzId,
            openLibraryId,
            ...(seriesAsin === undefined || seriesAsin === null ? {} : { seriesAsin }),
            libraryId,
            ...(courOrder === undefined || courOrder === null ? {} : { courOrder }),
          }),
        );
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

    retry: async (id: string, scope: SearchScope | null = null): Promise<MediaRequest | null> => {
      const record = await requests.find(id);

      if (record === null) {
        return null;
      }

      const at = now().toISOString();

      for (const item of await itemsOf(id)) {
        const isInScope = isItemInScope(item, scope, (record.anime ?? null) !== null);

        if (isInScope && (item.state === 'failed' || item.state === 'wanted')) {
          await items.update(item.id, {
            state: 'wanted',
            problem: null,
            attempts: 0,
            lastSearchedAt: null,
            ...(scope === null ? {} : { isFollowed: true }),
            updatedAt: at,
          });
        }
      }

      return changed(id, { problem: null, isPickedByHand: false });
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
      const versionsArrived = filed.flatMap((item) =>
        item.versionProfileId === null || item.versionProfileId === undefined
          ? []
          : [item.versionProfileId],
      );

      return shownNow === null
        ? null
        : {
            request: shownNow,
            newlyAvailable: filed.length - versionsArrived.length,
            versionsArrived,
          };
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
        if (item.versionProfileId !== null && item.versionProfileId !== undefined) {
          return item.state === 'filed';
        }

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

      const versionsArrived = arriving.flatMap((item) =>
        item.versionProfileId === null || item.versionProfileId === undefined
          ? []
          : [item.versionProfileId],
      );

      return shownNow === null
        ? null
        : {
            request: shownNow,
            newlyAvailable: arriving.length - versionsArrived.length,
            versionsArrived,
          };
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
      for (const book of (await requests.list()).filter((one) => one.seriesRequestId === id)) {
        for (const item of await itemsOf(book.id)) {
          await items.remove(item.id);
        }

        await requests.remove(book.id);
      }

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
