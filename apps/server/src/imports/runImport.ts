import { eq } from 'drizzle-orm';
import { MOST_COLLECTION_ENTRIES } from '@ValenceContracts/schemas/Collection';
import type { CollectionSubject } from '@ValenceContracts/schemas/Collection';
import type { MediaImportCounts, MediaImportReport } from '@ValenceContracts/schemas/MediaImport';
import { saying } from '@ValenceI18n/saying';
import { insertUnlessPresent } from '@ValenceDatabase/insertUnlessPresent';
import { collection, favouriteArtist } from '#dialect/Schema';
import { nameKey } from '@ValenceServer/music/nameKey';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { IMPORT_PHASES } from './ImportRecords';
import type {
  ImportCursor,
  ImportPhase,
  StoredImportRun,
  StoredImportSource,
} from './ImportRecords';
import { bringPersonAcross } from './bringPersonAcross';
import { locateSourceLibraries } from './locateSourceLibraries';
import { mergeImportedSegments } from './mergeImportedSegments';
import { noCounts } from './noCounts';
import { readSourceCatalogue } from './readSourceCatalogue';
import type { SourceCatalogue } from './readSourceCatalogue';
import { readValenceIndex } from './readValenceIndex';
import type { ValenceIndex } from './readValenceIndex';
import { readerOfSource } from './readerOfSource';
import { skipReasonOf } from './skipReasonOf';
import { viewingOf } from './viewingOf';
import { writeImportedPlays } from './writeImportedPlays';
import { writeImportedProgress } from './writeImportedProgress';
import type { ImportServices } from './ImportServices';
import type { SourceReader, SourceUser } from './SourceReader';

type Person = {
  user: SourceUser;
  userId: string;
  profileId: string;
};

type RunState = {
  services: ImportServices;
  run: StoredImportRun;
  source: StoredImportSource;
  reader: SourceReader;
  jobId: string;
  report: MediaImportReport;
  written: MediaImportCounts;
};

const COLLECTION_LINK = 'collection';

const PLAYLIST_LINK = 'playlist';

const MOST_AT_ONCE = 500;

/**
 * Whether a phase comes before where a run had got to, so a run picked up again after a restart
 * passes over what it already did.
 *
 * @param phase - The phase.
 * @param cursor - Where the run had got to.
 * @returns Whether it is already done.
 */
const isBehind = (phase: ImportPhase, cursor: ImportCursor | null): boolean =>
  cursor !== null && IMPORT_PHASES.indexOf(phase) < IMPORT_PHASES.indexOf(cursor.phase);

/**
 * Where to start within a phase: past what was done before a restart, or at the start.
 *
 * @param phase - The phase.
 * @param cursor - Where the run had got to.
 * @returns The first index still to do.
 */
const startOf = (phase: ImportPhase, cursor: ImportCursor | null): number =>
  cursor?.phase === phase ? cursor.index : 0;

/**
 * Remembers how far a run has got and what it has written, so a restart carries on from there.
 *
 * @param state - The run.
 * @param cursor - Where it has got to.
 */
const remember = async (state: RunState, cursor: ImportCursor): Promise<void> => {
  state.run.cursor = cursor;
  await state.services.store.changeRun(state.run.id, {
    cursor,
    report: { ...state.report, written: state.written },
  });
};

/**
 * Brings each person's account across, or finds the one already here.
 *
 * @param state - The run.
 * @param users - Everybody on the source.
 */
const bringAccounts = async (state: RunState, users: readonly SourceUser[]): Promise<void> => {
  const { services, run, source, reader, jobId, report } = state;

  for (let index = startOf('accounts', run.cursor); index < users.length; index += 1) {
    const user = users[index];

    if (user === undefined || services.jobs.isCancelled(jobId)) {
      return;
    }

    services.jobs.reportProgress(
      jobId,
      saying('server.imports.progress.bringingTheAccountsAcross'),
      index,
      users.length,
      user.name,
    );

    const person = report.people.find((one) => one.sourceUserId === user.id);

    if (person !== undefined && skipReasonOf(user, run.options) === null) {
      const brought = await bringPersonAcross(
        services,
        reader,
        source.id,
        user,
        {
          isYou: run.options.meUserId === user.id,
          by: run.options.by,
          sourceName: report.source.name,
        },
        jobId,
      );

      person.userId = brought?.userId ?? null;
      person.outcome = brought?.outcome ?? 'failed';
      state.written.people += brought === null ? 0 : 1;
    }

    await remember(state, { phase: 'accounts', index: index + 1 });
  }
};

/**
 * The people who came across, each with their account and the profile their watching goes on.
 *
 * @param state - The run.
 * @param users - Everybody on the source.
 * @returns Those who came across.
 */
const peopleOf = async (state: RunState, users: readonly SourceUser[]): Promise<Person[]> => {
  const people: Person[] = [];

  for (const user of users) {
    const person = state.report.people.find((one) => one.sourceUserId === user.id);

    if (person?.userId === null || person?.userId === undefined || person.skipped !== null) {
      continue;
    }

    const profile = await state.services.profiles.ensureDefault(person.userId, user.name);

    people.push({ user, userId: person.userId, profileId: profile.id });
  }

  return people;
};

/**
 * Sets which libraries each person may see and the age ceiling on them, as the source had it.
 *
 * @param state - The run.
 * @param people - Those who came across.
 * @param catalogue - The source's libraries.
 */
const setAccess = async (
  state: RunState,
  people: readonly Person[],
  catalogue: SourceCatalogue,
): Promise<void> => {
  const { services, source, jobId } = state;
  const libraries = await services.library.list(asTheServer);
  const kinds = new Map(libraries.map((library) => [library.id, library.kind]));
  const located = locateSourceLibraries(
    catalogue.libraries,
    source.details.pathMappings,
    libraries,
    await services.store.links(source.id, 'library'),
  );

  for (const [index, person] of people.entries()) {
    services.jobs.reportProgress(
      jobId,
      saying('server.imports.progress.settingWhatEachPersonMaySee'),
      index,
      people.length,
      person.user.name,
    );

    if (person.user.isAdministrator || person.userId === state.run.options.by) {
      continue;
    }

    const access = person.user.libraryAccess;

    for (const library of located) {
      const allowed = access.kind === 'all' || access.libraryIds.includes(library.sourceLibraryId);

      for (const location of library.locations) {
        if (location.libraryId === null) {
          continue;
        }

        if (!allowed) {
          await services.library.refuseLibrary(person.userId, location.libraryId);

          continue;
        }

        await services.library.allowLibrary(person.userId, location.libraryId);

        const kind = kinds.get(location.libraryId);

        if (person.user.ceiling !== null && (kind === 'movies' || kind === 'shows')) {
          await services.library.setCeiling(person.userId, {
            libraryId: location.libraryId,
            maximumAge: person.user.ceiling.maximumAge,
            allowsUnrated: person.user.ceiling.allowsUnrated,
          });
        }
      }
    }
  }
};

/**
 * Brings each person's watching across: what they finished, where they stopped, every viewing
 * with its date, what they kept and how they rated things.
 *
 * @param state - The run.
 * @param people - Those who came across.
 * @param catalogue - What each source item matched.
 * @param index - What Valence holds.
 */
const bringViewing = async (
  state: RunState,
  people: readonly Person[],
  catalogue: SourceCatalogue,
  index: ValenceIndex,
): Promise<void> => {
  const { services, run, source, reader, jobId, written } = state;

  for (let at = startOf('viewing', run.cursor); at < people.length; at += 1) {
    const person = people[at];

    if (person === undefined || services.jobs.isCancelled(jobId)) {
      return;
    }

    services.jobs.reportProgress(
      jobId,
      saying('server.imports.progress.bringingEachPersonsWatchingAcross'),
      at,
      people.length,
      person.user.name,
    );

    const viewing = viewingOf({
      sourceId: source.id,
      userId: person.user.id,
      states: await reader.userStates(person.user),
      plays: await reader.plays(person.user),
      catalogue,
      durations: index.durations,
      now: new Date(),
    });

    for (const watched of viewing.watched) {
      written.watched += (await writeImportedProgress(services.db, {
        profileId: person.profileId,
        mediaItemId: watched.mediaItemId,
        positionSeconds: watched.durationSeconds,
        durationSeconds: watched.durationSeconds,
        isFinished: true,
        at: watched.at,
      }))
        ? 1
        : 0;
    }

    for (const resume of viewing.resumes) {
      written.resumes += (await writeImportedProgress(services.db, {
        profileId: person.profileId,
        mediaItemId: resume.mediaItemId,
        positionSeconds: resume.positionSeconds,
        durationSeconds: resume.durationSeconds,
        isFinished: false,
        at: resume.at,
      }))
        ? 1
        : 0;
    }

    await writeImportedPlays(
      services.db,
      source.kind,
      viewing.plays.map((play) => ({ ...play, profileId: person.profileId })),
    );
    written.plays += viewing.plays.length;

    for (const mediaItemId of viewing.favourites) {
      await services.favourites.keep(person.profileId, mediaItemId);
      written.favourites += 1;
    }

    for (const rating of viewing.ratings) {
      await services.ratings.set(person.profileId, rating.subject, rating.stars);
      written.ratings += 1;
    }

    for (const artist of await reader.favouriteArtists(person.user)) {
      const byName = index.artistsByName.get(nameKey(artist.name)) ?? [];
      const artistId =
        (artist.musicBrainzId === null
          ? undefined
          : index.artistsByMusicBrainz.get(artist.musicBrainzId.toLowerCase())) ??
        (byName.length === 1 ? byName[0] : undefined);

      if (artistId === undefined) {
        continue;
      }

      await insertUnlessPresent(services.db, favouriteArtist, {
        values: [{ profileId: person.profileId, artistId, keptAt: new Date() }],
        target: [favouriteArtist.profileId, favouriteArtist.artistId],
      });
      written.favourites += 1;
    }

    await remember(state, { phase: 'viewing', index: at + 1 });
  }
};

/**
 * Builds a Valence collection for each collection on the source, filled with what matched, and
 * refills the one an earlier import built rather than building another.
 *
 * @param state - The run.
 * @param catalogue - What each source item matched.
 */
const bringCollections = async (state: RunState, catalogue: SourceCatalogue): Promise<void> => {
  const { services, source, reader, jobId, run } = state;
  const collections = services.collections;

  if (collections === null) {
    return;
  }

  const found = await reader.collections();
  const links = await services.store.links(source.id, COLLECTION_LINK);

  for (const [index, one] of found.entries()) {
    if (services.jobs.isCancelled(jobId)) {
      return;
    }

    services.jobs.reportProgress(
      jobId,
      saying('server.imports.progress.buildingTheCollections'),
      index,
      found.length,
      one.name,
    );

    const seen = new Set<string>();
    const entries: CollectionSubject[] = [];

    for (const itemId of one.itemIds) {
      const match = catalogue.matches.get(itemId);
      const subject: CollectionSubject | null =
        match?.kind === 'item'
          ? { mediaItemId: match.mediaItemId }
          : match?.kind === 'series'
            ? { seriesId: match.seriesId }
            : null;
      const key = subject === null ? null : JSON.stringify(subject);

      if (
        subject !== null &&
        key !== null &&
        !seen.has(key) &&
        entries.length < MOST_COLLECTION_ENTRIES
      ) {
        seen.add(key);
        entries.push(subject);
      }
    }

    if (entries.length === 0) {
      continue;
    }

    const remembered = links.get(one.id);
    const [stillThere] =
      remembered === undefined
        ? []
        : await services.db
            .select({ id: collection.id })
            .from(collection)
            .where(eq(collection.id, remembered))
            .limit(1);

    if (stillThere !== undefined && (await collections.replaceEntries(stillThere.id, entries))) {
      state.written.collections += 1;

      continue;
    }

    const made = await collections.create({
      name: one.name.slice(0, 100),
      description: one.description?.slice(0, 2000) ?? null,
      isOrdered: false,
      entries,
      createdBy: run.options.by,
    });

    await services.store.setLink(source.id, COLLECTION_LINK, one.id, made.id);
    state.written.collections += 1;
  }
};

/**
 * Brings each person's playlists across, owned by their profile, refilling the ones an earlier
 * import made rather than making them again.
 *
 * @param state - The run.
 * @param people - Those who came across.
 * @param catalogue - What each source item matched.
 */
const bringPlaylists = async (
  state: RunState,
  people: readonly Person[],
  catalogue: SourceCatalogue,
): Promise<void> => {
  const { services, source, reader, jobId } = state;
  const byOwner = await reader.playlists(people.map((person) => person.user));
  const links = await services.store.links(source.id, PLAYLIST_LINK);

  for (const [index, person] of people.entries()) {
    if (services.jobs.isCancelled(jobId)) {
      return;
    }

    services.jobs.reportProgress(
      jobId,
      saying('server.imports.progress.bringingThePlaylistsAcross'),
      index,
      people.length,
      person.user.name,
    );

    const viewer: Viewer = {
      kind: 'account',
      accountId: person.userId,
      profileId: person.profileId,
      isAdministrator: false,
    };

    for (const list of byOwner.get(person.user.id) ?? []) {
      const mediaItemIds = list.itemIds.flatMap((itemId) => {
        const match = catalogue.matches.get(itemId);

        return match?.kind === 'item' ? [match.mediaItemId] : [];
      });
      const key = `${person.user.id}:${list.id}`;
      const remembered = links.get(key);
      const held =
        remembered === undefined ? null : await services.playlists.read(viewer, remembered);
      let playlistId = held?.playlist.id ?? null;

      if (held !== null && playlistId !== null) {
        for (const entry of held.entries) {
          await services.playlists.drop(viewer, playlistId, entry.id);
        }
      } else {
        const made = await services.playlists.create(viewer, {
          name: list.name.slice(0, 100),
          isOrdered: true,
        });

        if (made === null) {
          services.recordIssue(
            jobId,
            list.name,
            saying('server.imports.runImport.thePlaylistCouldNotBeMade'),
          );

          continue;
        }

        playlistId = made.id;
        await services.store.setLink(source.id, PLAYLIST_LINK, key, made.id);
      }

      for (let start = 0; start < mediaItemIds.length; start += MOST_AT_ONCE) {
        await services.playlists.add(
          viewer,
          playlistId,
          mediaItemIds.slice(start, start + MOST_AT_ONCE),
        );
      }

      if (list.isShared) {
        await services.playlists.update(viewer, playlistId, { isShared: true });
      }

      state.written.playlists += 1;
    }
  }
};

/**
 * Brings intro and credits markers across for each film and episode that matched, keeping any
 * somebody set by hand.
 *
 * @param state - The run.
 * @param catalogue - What each source item matched.
 */
const bringMarkers = async (state: RunState, catalogue: SourceCatalogue): Promise<void> => {
  const { services, reader, jobId, run } = state;
  const items = catalogue.items.filter(
    (item) =>
      (item.kind === 'movie' || item.kind === 'episode') &&
      catalogue.matches.get(item.id)?.kind === 'item',
  );

  for (let index = startOf('markers', run.cursor); index < items.length; index += 1) {
    const item = items[index];
    const match = item === undefined ? undefined : catalogue.matches.get(item.id);

    if (item === undefined || match?.kind !== 'item' || services.jobs.isCancelled(jobId)) {
      return;
    }

    services.jobs.reportProgress(
      jobId,
      saying('server.imports.progress.bringingIntroAndCreditsMarkersAcross'),
      index,
      items.length,
      item.title,
    );

    try {
      const markers = await reader.markers(item);
      const merged =
        markers.length === 0
          ? null
          : mergeImportedSegments(await services.segments.list(match.mediaItemId), markers);

      if (merged !== null) {
        await services.segments.replace(match.mediaItemId, merged);
        state.written.markers += 1;
      }
    } catch {
      services.recordIssue(
        jobId,
        item.title,
        saying('server.imports.runImport.itsMarkersCouldNotBeRead'),
      );
    }

    if (index % 25 === 24) {
      await remember(state, { phase: 'markers', index: index + 1 });
    }
  }
};

/**
 * Carries out a planned import as a job: accounts, then what each may see, their watching,
 * collections, playlists and markers, remembering how far it has got so a restart carries on, and
 * writing everything so that running it again changes rather than repeats.
 *
 * @param services - What the import works with.
 * @param runId - The run.
 * @param jobId - The job carrying it out.
 * @returns How the run ended.
 */
const runImport = async (
  services: ImportServices,
  runId: string,
  jobId: string,
): Promise<'completed' | 'cancelled' | 'missing'> => {
  const run = await services.store.findRun(runId);
  const source = run === null ? null : await services.store.findSource(run.sourceId);

  if (run === null || source === null || run.report === null) {
    return 'missing';
  }

  const reader = readerOfSource(services, source, await services.regions());
  const state: RunState = {
    services,
    run,
    source,
    reader,
    jobId,
    report: run.report,
    written: run.report.written ?? noCounts(),
  };
  const cancelled = async (): Promise<'cancelled'> => {
    await services.store.changeRun(runId, {
      state: 'cancelled',
      finishedAt: new Date(),
      report: { ...state.report, written: state.written },
    });

    return 'cancelled';
  };

  await services.store.changeRun(runId, {
    state: 'importing',
    startedAt: run.startedAt ?? new Date(),
    jobId,
  });

  const users = await reader.users();

  if (!isBehind('accounts', run.cursor)) {
    await bringAccounts(state, users);
  }

  if (services.jobs.isCancelled(jobId)) {
    return cancelled();
  }

  services.jobs.reportProgress(
    jobId,
    saying('server.imports.progress.matchingWhatIsOnSource', { source: state.report.source.name }),
    0,
    1,
  );

  const index = await readValenceIndex(services.db);
  const catalogue = await readSourceCatalogue({
    reader,
    index,
    mappings: source.details.pathMappings,
    tmdbOfTvdb: services.tmdbOfTvdb,
    onLibrary: (done, total, name) => {
      services.jobs.reportProgress(
        jobId,
        saying('server.imports.progress.matchingWhatIsOnSource', {
          source: state.report.source.name,
        }),
        done,
        total,
        name,
      );
    },
  });
  const people = await peopleOf(state, users);

  if (!isBehind('access', run.cursor)) {
    await setAccess(state, people, catalogue);
    await remember(state, { phase: 'viewing', index: startOf('viewing', run.cursor) });
  }

  if (!isBehind('viewing', run.cursor)) {
    await bringViewing(state, people, catalogue, index);
  }

  if (services.jobs.isCancelled(jobId)) {
    return cancelled();
  }

  if (!isBehind('collections', run.cursor)) {
    await remember(state, { phase: 'collections', index: 0 });
    await bringCollections(state, catalogue);
  }

  if (!isBehind('playlists', run.cursor)) {
    await remember(state, { phase: 'playlists', index: 0 });
    await bringPlaylists(state, people, catalogue);
  }

  if (services.jobs.isCancelled(jobId)) {
    return cancelled();
  }

  if (!isBehind('markers', run.cursor)) {
    await remember(state, { phase: 'markers', index: startOf('markers', run.cursor) });
    await bringMarkers(state, catalogue);
  }

  if (services.jobs.isCancelled(jobId)) {
    return cancelled();
  }

  await services.store.changeRun(runId, {
    state: 'completed',
    cursor: { phase: 'done', index: 0 },
    finishedAt: new Date(),
    report: { ...state.report, written: state.written },
  });

  return 'completed';
};

export { runImport };
