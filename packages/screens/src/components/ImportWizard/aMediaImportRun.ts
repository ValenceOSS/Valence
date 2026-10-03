/* oxlint-disable valence/no-hard-coded-strings -- test fixtures: the titles and names stand in for what a real server holds, and are never shown */
import type { MediaImportReport, MediaImportRun } from '@ValenceContracts/schemas/MediaImport';

const A_REPORT: MediaImportReport = {
  source: { kind: 'jellyfin', name: 'Den', version: '12.1.0' },
  counts: {
    people: 2,
    libraries: 2,
    items: 10,
    matched: 9,
    unmatched: 1,
    watched: 5,
    resumes: 1,
    plays: 12,
    favourites: 2,
    ratings: 3,
    playlists: 1,
    collections: 1,
    markers: 4,
  },
  people: [
    {
      sourceUserId: 'u-pat',
      name: 'Pat',
      username: 'pat',
      email: null,
      isAdministrator: true,
      isDisabled: false,
      isYou: true,
      skipped: null,
      watched: 5,
      resumes: 1,
      plays: 12,
      favourites: 2,
      ratings: 3,
      playlists: 1,
      libraries: null,
      maximumAge: null,
      userId: null,
      outcome: null,
    },
    {
      sourceUserId: 'u-ash',
      name: 'Ash',
      username: null,
      email: null,
      isAdministrator: false,
      isDisabled: false,
      isYou: false,
      skipped: {
        code: 'server.imports.skipReasonOf.theirPinWasNotGiven',
        message: 'Their Plex PIN was not given, so they were left out.',
        values: {},
      },
      watched: 0,
      resumes: 0,
      plays: 0,
      favourites: 0,
      ratings: 0,
      playlists: 0,
      libraries: 1,
      maximumAge: 13,
      userId: null,
      outcome: null,
    },
  ],
  unmatched: [
    {
      title: 'A Home Movie',
      year: 2019,
      kind: 'movie',
      reason: {
        code: 'server.imports.matchSourceItem.nothingMatches',
        message:
          'Nothing in Valence has the same catalogue id, file or title. Scan its library, then plan again.',
        values: {},
      },
    },
  ],
  unmatchedTotal: 4,
  notBroughtAcross: [
    {
      code: 'server.imports.planImport.passwordsStayBehind',
      message:
        'Passwords cannot be copied, so each new account signs in the first time with a setup link.',
      values: {},
    },
  ],
  written: null,
};

/**
 * An import as the server describes one, with whatever a test changes.
 *
 * @param changes - What differs from a run still being planned.
 * @returns The import.
 */
const aMediaImportRun = (changes: Partial<MediaImportRun> = {}): MediaImportRun => ({
  id: 'run',
  sourceId: 'source',
  state: 'planning',
  report: null,
  failure: null,
  progress: null,
  createdAt: '2026-10-02T00:00:00.000Z',
  startedAt: null,
  finishedAt: null,
  ...changes,
});

export { A_REPORT, aMediaImportRun };
