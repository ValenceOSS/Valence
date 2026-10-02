import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import { sayingCount } from '@ValenceI18n/sayingCount';
import type {
  MediaImportReport,
  MediaImportReportPerson,
  MediaImportUnmatched,
} from '@ValenceContracts/schemas/MediaImport';
import { noCounts } from './noCounts';
import { readSourceCatalogue } from './readSourceCatalogue';
import { readValenceIndex } from './readValenceIndex';
import { readerOfSource } from './readerOfSource';
import { skipReasonOf } from './skipReasonOf';
import { viewingOf } from './viewingOf';
import type { ImportServices } from './ImportServices';
import type { SourceItemKind } from './SourceReader';

const MOST_UNMATCHED_SHOWN = 500;

const UNMATCHED_KINDS: Readonly<Record<SourceItemKind, MediaImportUnmatched['kind']>> = {
  movie: 'movie',
  series: 'series',
  episode: 'episode',
  track: 'track',
  artist: 'other',
  album: 'other',
  other: 'other',
};

/**
 * Reads everything a source holds without writing anything, and writes down what an import would
 * bring across: how much of each thing, who each person is and what they would get, and what could
 * not be matched and why.
 *
 * @param services - What the import works with.
 * @param runId - The run being planned.
 * @param jobId - The job planning it, for reporting progress.
 * @returns Whether the plan was finished, rather than cancelled.
 */
const planImport = async (
  services: ImportServices,
  runId: string,
  jobId: string,
): Promise<boolean> => {
  const { store, jobs } = services;
  const run = await store.findRun(runId);
  const source = run === null ? null : await store.findSource(run.sourceId);

  if (run === null || source === null) {
    return false;
  }

  const regions = await services.regions();
  const reader = readerOfSource(services, source, regions);
  const identity = await reader.identify();
  const sourceName = identity.name;

  jobs.reportProgress(
    jobId,
    saying('server.imports.progress.readingTheLibrariesOnSource', { source: sourceName }),
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
      jobs.reportProgress(
        jobId,
        saying('server.imports.progress.readingTheLibrariesOnSource', { source: sourceName }),
        done,
        total,
        name,
      );
    },
  });
  const users = await reader.users();
  const counts = noCounts();
  const people: MediaImportReportPerson[] = [];
  let unkeptFavourites = 0;

  for (const [done, user] of users.entries()) {
    if (jobs.isCancelled(jobId)) {
      return false;
    }

    jobs.reportProgress(
      jobId,
      saying('server.imports.progress.readingWhatEachPersonWatched'),
      done,
      users.length,
      user.name,
    );

    const skipped = skipReasonOf(user, run.options);
    const isYou = run.options.meUserId === user.id;
    const person: MediaImportReportPerson = {
      sourceUserId: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      isAdministrator: user.isAdministrator,
      isDisabled: user.isDisabled,
      isYou,
      skipped,
      watched: 0,
      resumes: 0,
      plays: 0,
      favourites: 0,
      ratings: 0,
      playlists: 0,
      libraries: user.libraryAccess.kind === 'all' ? null : user.libraryAccess.libraryIds.length,
      maximumAge: user.ceiling?.maximumAge ?? null,
      userId: null,
      outcome: null,
    };

    if (skipped === null) {
      const viewing = viewingOf({
        sourceId: source.id,
        userId: user.id,
        states: await reader.userStates(user),
        plays: await reader.plays(user),
        catalogue,
        durations: index.durations,
        now: new Date(),
      });
      const artists = await reader.favouriteArtists(user);

      person.watched = viewing.watched.length;
      person.resumes = viewing.resumes.length;
      person.plays = viewing.plays.length;
      person.favourites = viewing.favourites.length + artists.length;
      person.ratings = viewing.ratings.length;
      unkeptFavourites += viewing.unkeptFavourites;
      counts.people += 1;
    }

    people.push(person);
  }

  jobs.reportProgress(
    jobId,
    saying('server.imports.progress.readingCollectionsAndPlaylists'),
    0,
    1,
  );

  const takingPart = users.filter((user) => skipReasonOf(user, run.options) === null);
  const playlists = await reader.playlists(takingPart);
  const collections = await reader.collections();

  for (const person of people) {
    person.playlists = playlists.get(person.sourceUserId)?.length ?? 0;
    counts.watched += person.watched;
    counts.resumes += person.resumes;
    counts.plays += person.plays;
    counts.favourites += person.favourites;
    counts.ratings += person.ratings;
    counts.playlists += person.playlists;
  }

  const matches = [...catalogue.matches.values()];

  counts.libraries = catalogue.libraries.filter((library) => library.kind !== null).length;
  counts.items = matches.length;
  counts.unmatched = catalogue.unmatched.length;
  counts.matched = counts.items - counts.unmatched;
  counts.collections = collections.length;
  counts.markers = [...catalogue.matches.entries()].filter(([itemId, match]) => {
    const kind = catalogue.byId.get(itemId)?.kind;

    return match.kind === 'item' && (kind === 'movie' || kind === 'episode');
  }).length;

  const notBroughtAcross: Said[] = [
    saying('server.imports.planImport.passwordsStayBehind'),
    saying('server.imports.planImport.languagePreferencesStayBehind'),
  ];

  if (source.kind === 'plex') {
    notBroughtAcross.push(saying('server.imports.planImport.plexWatchlistsStayBehind'));
  } else {
    notBroughtAcross.push(
      saying('server.imports.planImport.playCountsAreSpreadOnSource', { source: sourceName }),
      saying('server.imports.planImport.likesStayBehind'),
    );
  }

  if (unkeptFavourites > 0) {
    notBroughtAcross.push(
      sayingCount('server.imports.planImport.favouriteProgrammesStayBehind', unkeptFavourites),
    );
  }

  if (services.collections === null && collections.length > 0) {
    notBroughtAcross.push(saying('server.imports.planImport.collectionsAreOff'));
  }

  const report: MediaImportReport = {
    source: { kind: source.kind, name: sourceName, version: identity.version },
    counts,
    people,
    unmatched: catalogue.unmatched.slice(0, MOST_UNMATCHED_SHOWN).map(({ item, reason }) => ({
      title: item.title,
      year: item.year,
      kind: UNMATCHED_KINDS[item.kind],
      reason,
    })),
    unmatchedTotal: catalogue.unmatched.length,
    notBroughtAcross,
    written: null,
  };

  await store.changeRun(runId, { state: 'planned', report, failure: null });

  return true;
};

export { planImport };
