import { fetchLinking } from '@ValenceClient/admin/fetchLinking';
import { fetchLinkActivity } from '@ValenceClient/admin/fetchLinkActivity';
import { fetchLinkSharing } from '@ValenceClient/admin/fetchLinkSharing';
import { fetchRemotePeople } from '@ValenceClient/admin/fetchRemotePeople';
import { fetchTheirActivity } from '@ValenceClient/admin/fetchTheirActivity';
import { fetchTheirLibraries } from '@ValenceClient/admin/fetchTheirLibraries';
import { fetchAlbums } from '@ValenceClient/music/fetchMusic';
import { fetchBooks } from '@ValenceClient/books/fetchBooks';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import {
  fetchAdminOverview,
  fetchRunningScans,
  fetchMonitor,
  fetchActiveSessions,
  fetchJobDefinitions,
  fetchJobHistory,
  fetchJobHistoryIssues,
  fetchJobSchedules,
} from '@ValenceClient/admin/fetchAdmin';
import { fetchJobRun } from '@ValenceClient/admin/fetchJobRun';
import { fetchJobStats } from '@ValenceClient/admin/fetchJobStats';
import { fetchLogFacets } from '@ValenceClient/admin/fetchLogFacets';
import { fetchLogHistogram } from '@ValenceClient/admin/fetchLogHistogram';
import { fetchLogs } from '@ValenceClient/admin/fetchLogs';
import { fetchAccounts } from '@ValenceClient/admin/fetchAccounts';
import { fetchAccountList } from '@ValenceClient/admin/fetchAccountList';
import { fetchAccountSessions } from '@ValenceClient/admin/fetchAccountSessions';
import { fetchFolders } from '@ValenceClient/admin/fetchFolders';
import { searchFolders } from '@ValenceClient/admin/searchFolders';
import { fetchLibraryFolder } from '@ValenceClient/admin/fetchLibraryFolder';
import { fetchFolderMeasure } from '@ValenceClient/admin/fetchFolderMeasure';
import { fetchMediaPaths } from '@ValenceClient/admin/fetchMediaPaths';
import { searchLibraryFiles } from '@ValenceClient/admin/searchLibraryFiles';
import { fetchResourceHistory } from '@ValenceClient/admin/fetchResourceHistory';
import {
  fetchRoles,
  fetchPermissionCatalogue,
  fetchAccountPermissions,
} from '@ValenceClient/admin/fetchRoles';
import { fetchWebhooks, fetchWebhookDeliveries } from '@ValenceClient/admin/fetchWebhooks';
import { fetchReencodes, fetchRenditions } from '@ValenceClient/admin/fetchReencodes';
import { whenToAskAgain } from '@ValenceClient/admin/whenToAskAgain';
import { fetchPreTranscoding } from '@ValenceClient/admin/fetchPreTranscoding';
import { fetchEmailSetup } from '@ValenceClient/admin/fetchEmailSetup';
import { fetchEverybodysShares } from '@ValenceClient/sharing/fetchShares';
import { readWholeLibrary } from '@ValenceClient/library/readWholeLibrary';
import type { JobRunQuery } from '@ValenceContracts/schemas/JobRun';
import type { LogFacetsQuery, LogHistogramQuery, LogQuery } from '@ValenceContracts/schemas/Log';
import type { ResourceSampleRange } from '@ValenceContracts/schemas/ResourceSample';
import { fetchExceptionsOn, fetchLibraryAccess } from '@ValenceClient/admin/fetchLibraryAccess';

const MOST_ALBUMS_LISTED = 500;
const EVERY_FILE_KEPT_FOR_MS = 5 * 60_000;

const ADMIN = ['admin'] as const;

const WATCHED_EVERY_MS = 5000;

const RECENT_FAILURES_MS = 86_400_000;

const RECENT_FAILURES_EVERY_MS = 30_000;

/**
 * What the server is doing at a glance.
 *
 * @returns The query.
 */
const overview = () =>
  queryOptions({
    queryKey: [...ADMIN, 'overview'],
    queryFn: () => fetchAdminOverview(),
  });

/**
 * Any scan under way, asked for repeatedly because a scan finishes without announcing it.
 *
 * @returns The query.
 */
const scans = () =>
  queryOptions({
    queryKey: [...ADMIN, 'scans'],
    queryFn: () => fetchRunningScans(),
    refetchInterval: WATCHED_EVERY_MS,
  });

/**
 * What the transcoder is doing.
 *
 * @returns The query.
 */
const monitor = () =>
  queryOptions({
    queryKey: [...ADMIN, 'monitor'],
    queryFn: () => fetchMonitor(),
  });

/**
 * Who is watching now.
 *
 * @returns The query.
 */
const sessions = () =>
  queryOptions({
    queryKey: [...ADMIN, 'sessions'],
    queryFn: () => fetchActiveSessions(),
  });

/**
 * The jobs this server knows how to run.
 *
 * @returns The query.
 */
const jobs = () =>
  queryOptions({
    queryKey: [...ADMIN, 'jobs'],
    queryFn: () => fetchJobDefinitions(),
  });

/**
 * The persisted history of job runs, filtered — what actually happened, rather than only
 * what the queue is doing this instant.
 *
 * @param query - What to filter the history by.
 * @returns The query.
 */
const jobHistory = (query: Partial<JobRunQuery>) =>
  queryOptions({
    queryKey: [...ADMIN, 'jobHistory', query],
    queryFn: () => fetchJobHistory(query),
  });

/**
 * How many job runs failed in the last day, and the latest of them — what the admin area warns about,
 * counted the same way as the job history filtered to failures over the last 24 hours, so the warning
 * and the list it opens agree.
 *
 * @returns The query.
 */
const recentFailures = () =>
  queryOptions({
    queryKey: [...ADMIN, 'recentFailures'],
    queryFn: () =>
      fetchJobHistory({ status: 'failed', sinceMs: Date.now() - RECENT_FAILURES_MS, limit: 1 }),
    refetchInterval: RECENT_FAILURES_EVERY_MS,
  });

/**
 * The per-item issues one job run accumulated, read only once a row is opened.
 *
 * @param jobRunId - Which run, or null where none is open.
 * @returns The query.
 */
const jobHistoryIssues = (jobRunId: string | null) =>
  queryOptions({
    queryKey: [...ADMIN, 'jobHistoryIssues', jobRunId],
    queryFn: () => fetchJobHistoryIssues(jobRunId ?? ''),
    enabled: jobRunId !== null,
  });

/**
 * A page of the log, filtered, ordered and cut to a length.
 *
 * @param query - What to look for, how to order it and how many records to read.
 * @returns The query.
 */
const logs = (query: Partial<LogQuery>) =>
  queryOptions({
    queryKey: [...ADMIN, 'logs', query],
    queryFn: () => fetchLogs(query),
  });

/**
 * The log read a page after another, for a list that loads more as it is scrolled.
 *
 * There is no ceiling: it reads on for as long as the list is scrolled and there are lines left.
 *
 * @param query - What to look for, how to order it and how many records make a page.
 * @returns The query.
 */
const logPages = (query: Partial<LogQuery>) =>
  infiniteQueryOptions({
    queryKey: [...ADMIN, 'logPages', query],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchLogs({ ...query, offset: pageParam }),
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.records.length, 0);

      return last.records.length > 0 && loaded < last.total ? loaded : undefined;
    },
  });

/**
 * The log counted over time by level, for the records a query matches.
 *
 * @param query - What to count, and how many bars to count it into.
 * @returns The query.
 */
const logHistogram = (query: Partial<LogHistogramQuery>) =>
  queryOptions({
    queryKey: [...ADMIN, 'logHistogram', query],
    queryFn: () => fetchLogHistogram(query),
  });

/**
 * The sources and kinds of job the matching records come from most often.
 *
 * @param query - What to count.
 * @returns The query.
 */
const logFacets = (query: Partial<LogFacetsQuery>) =>
  queryOptions({
    queryKey: [...ADMIN, 'logFacets', query],
    queryFn: () => fetchLogFacets(query),
  });

/**
 * How each kind of job has gone since a moment.
 *
 * @param sinceMs - The earliest a counted run was created.
 * @returns The query.
 */
const jobStats = (sinceMs: number) =>
  queryOptions({
    queryKey: [...ADMIN, 'jobStats', sinceMs],
    queryFn: () => fetchJobStats(sinceMs),
  });

/**
 * One job run, read only where a run is named.
 *
 * @param jobRunId - Which run, or null where none is.
 * @returns The query.
 */
const jobRun = (jobRunId: string | null) =>
  queryOptions({
    queryKey: [...ADMIN, 'jobRun', jobRunId],
    queryFn: () => fetchJobRun(jobRunId ?? ''),
    enabled: jobRunId !== null,
  });

/**
 * A range of the server's load history, for the overview's chart once it looks further back than
 * the last minute.
 *
 * @param range - How far back to read.
 * @returns The query.
 */
const resourceHistory = (range: ResourceSampleRange) =>
  queryOptions({
    queryKey: [...ADMIN, 'resourceHistory', range],
    queryFn: () => fetchResourceHistory(range),
  });

/**
 * When those jobs are set to run, and the clock the server runs them on.
 *
 * The timezone travels with the schedule because it is a property of the schedule: a trigger that
 * says 03:00 says nothing until you know whose 03:00 it is.
 *
 * @returns The query.
 */
const schedules = () =>
  queryOptions({
    queryKey: [...ADMIN, 'schedules'],
    queryFn: () => fetchJobSchedules(),
  });

/**
 * The accounts on this server.
 *
 * @returns The query.
 */
const accounts = () =>
  queryOptions({
    queryKey: [...ADMIN, 'accounts'],
    queryFn: () => fetchAccounts(),
  });

/**
 * The accounts on this server, with whether their setup links can be sent by email.
 *
 * @returns The query.
 */
const accountList = () =>
  queryOptions({
    queryKey: [...ADMIN, 'accounts', 'list'],
    queryFn: () => fetchAccountList(),
  });

/**
 * The roles, and what each of them may do.
 *
 * @returns The query.
 */
const roles = () =>
  queryOptions({
    queryKey: [...ADMIN, 'roles'],
    queryFn: () => fetchRoles(),
  });

/**
 * Every permission there is, which is what a role is assembled from.
 *
 * @returns The query.
 */
const permissions = () =>
  queryOptions({
    queryKey: [...ADMIN, 'permissions'],
    queryFn: () => fetchPermissionCatalogue(),
  });

/**
 * What one account may do, roles and overrides together.
 *
 * @param accountId - Whose, or null where nobody is open.
 * @returns The query.
 */
const accountPermissions = (accountId: string | null) =>
  queryOptions({
    queryKey: [...ADMIN, 'accountPermissions', accountId],
    queryFn: () => fetchAccountPermissions(accountId ?? ''),
    enabled: accountId !== null,
  });

/**
 * The webhooks this server will call.
 *
 * @returns The query.
 */
/**
 * Which libraries an account is allowed to see, for the panel that decides it.
 *
 * @param accountId - The account being looked at.
 * @returns The query.
 */
const libraryAccess = (accountId: string | null) =>
  queryOptions({
    queryKey: [...ADMIN, 'libraryAccess', accountId],
    queryFn: () => fetchLibraryAccess(accountId ?? ''),
    enabled: accountId !== null,
  });

const webhooks = () =>
  queryOptions({
    queryKey: [...ADMIN, 'webhooks'],
    queryFn: () => fetchWebhooks(),
  });

/**
 * This server's identity, its open invites, and the servers it is linked with.
 *
 * @returns The query.
 */
const linking = () =>
  queryOptions({
    queryKey: [...ADMIN, 'linking'],
    queryFn: () => fetchLinking(),
  });

/**
 * What this server shares with one linked server.
 *
 * @param id - The linked server.
 */
const linkSharing = (id: string) =>
  queryOptions({
    queryKey: [...ADMIN, 'linking', id, 'sharing'],
    queryFn: () => fetchLinkSharing(id),
  });

/**
 * The people from one linked server this one has seen.
 *
 * @param id - The linked server.
 */
const remotePeople = (id: string) =>
  queryOptions({
    queryKey: [...ADMIN, 'linking', id, 'people'],
    queryFn: () => fetchRemotePeople(id),
  });

/**
 * This server's record of what one linked server asked for.
 *
 * @param id - The linked server.
 */
const linkActivity = (id: string) =>
  queryOptions({
    queryKey: [...ADMIN, 'linking', id, 'activity'],
    queryFn: () => fetchLinkActivity(id),
  });

/**
 * What one linked server shares with this one, asked of it.
 *
 * @param id - The linked server.
 */
const theirLibraries = (id: string) =>
  queryOptions({
    queryKey: [...ADMIN, 'linking', id, 'theirLibraries'],
    queryFn: () => fetchTheirLibraries(id),
  });

/**
 * One linked server's record of this server's people, asked of it.
 *
 * @param id - The linked server.
 */
const theirActivity = (id: string) =>
  queryOptions({
    queryKey: [...ADMIN, 'linking', id, 'theirActivity'],
    queryFn: () => fetchTheirActivity(id),
  });

/**
 * What happened the last times one was called.
 *
 * @param webhookId - Which webhook, or null where none is open.
 * @returns The query.
 */
const deliveries = (webhookId: string | null) =>
  queryOptions({
    queryKey: [...ADMIN, 'deliveries', webhookId],
    queryFn: () => fetchWebhookDeliveries(webhookId ?? ''),
    enabled: webhookId !== null,
  });

/**
 * Every album in the music libraries, by title, for the media panel to list beside the films and
 * programmes and to correct from.
 *
 * @returns The query.
 */
const albums = () =>
  queryOptions({
    queryKey: [...ADMIN, 'albums'],
    queryFn: () => fetchAlbums('title', MOST_ALBUMS_LISTED),
  });

/**
 * Every book on every shelf, for the media panel to list beside the films and programmes and to
 * correct from.
 *
 * @param libraryIds - The book libraries to read.
 * @returns The query.
 */
const books = (libraryIds: readonly string[]) =>
  queryOptions({
    queryKey: [...ADMIN, 'books', [...libraryIds].sort()],
    queryFn: async () => (await Promise.all(libraryIds.map((id) => fetchBooks(id)))).flat(),
    enabled: libraryIds.length > 0,
  });

/**
 * Every file on the server, one entry per file rather than per thing: every episode and every
 * version of a film is its own file on its own disk, which is what re-encoding and the media panel
 * both work from. The panel gathers episodes under their series and versions under their film
 * itself. It is a page a library at a time across every library, so it is kept for five minutes
 * rather than read again each time the panel opens; whatever changes the files says so.
 *
 * @param libraryIds - The libraries to read, which is all of them.
 * @returns The query.
 */
const everyFile = (libraryIds: readonly string[]) =>
  queryOptions({
    queryKey: [...ADMIN, 'everyFile', [...libraryIds].sort()],
    queryFn: async () => {
      const shelves = await Promise.all(libraryIds.map((id) => readWholeLibrary(id, true)));

      return shelves.flat();
    },
    enabled: libraryIds.length > 0,
    staleTime: EVERY_FILE_KEPT_FOR_MS,
  });

/**
 * Every link this server has handed out, and who handed each one out.
 *
 * @returns The query.
 */
const shares = () =>
  queryOptions({
    queryKey: [...ADMIN, 'shares'],
    queryFn: () => fetchEverybodysShares(),
  });

/**
 * The folders inside one on the machine running Valence, for choosing where a library lives. Not
 * retried: a folder that is not there is an answer, and asking three more times only delays it.
 *
 * @param path - The folder, or nothing for the places to start from.
 * @returns The query.
 */
const folders = (path: string | null) =>
  queryOptions({
    queryKey: [...ADMIN, 'folders', path],
    queryFn: () => fetchFolders(path),
    retry: false,
  });

/**
 * The folders whose names hold some words, below one on the machine running Valence. Not retried,
 * for the reason the listing is not: a search that found nothing has answered.
 *
 * @param words - What the names should hold.
 * @param within - The folder to look below, or nothing for the places to start from.
 * @returns The query.
 */
const folderSearch = (words: string, within: string | null) =>
  queryOptions({
    queryKey: [...ADMIN, 'folders', within, 'search', words],
    queryFn: () => searchFolders(words, within),
    retry: false,
  });

/**
 * Where on the disk every item in some libraries is, for showing a title's file beside it.
 *
 * @param libraryIds - The libraries to read, which is all of them.
 * @returns The query, answering each item's file by the item.
 */
const mediaPaths = (libraryIds: readonly string[]) =>
  queryOptions({
    queryKey: [...ADMIN, 'mediaPaths', [...libraryIds].sort()],
    queryFn: async () =>
      (await Promise.all(libraryIds.map((id) => fetchMediaPaths(id)))).reduce<
        Record<string, string>
      >((all, one) => ({ ...all, ...one }), {}),
    enabled: libraryIds.length > 0,
    staleTime: EVERY_FILE_KEPT_FOR_MS,
  });

/**
 * What is in a folder inside a library, for the file manager. Not retried: a folder that is not
 * there, or not inside a library, is an answer.
 *
 * @param path - The folder, or nothing for the libraries.
 * @returns The query.
 */
const libraryFolder = (path: string | null) =>
  queryOptions({
    queryKey: [...ADMIN, 'files', path],
    queryFn: () => fetchLibraryFolder(path),
    retry: false,
  });

/**
 * How much a folder inside a library takes on the disk and what it holds, read only while it is
 * shown, since adding up a large folder is not free.
 *
 * @param path - The folder, or nothing where none is shown.
 * @returns The query.
 */
const folderMeasure = (path: string | null) =>
  queryOptions({
    queryKey: [...ADMIN, 'files', 'measure', path],
    queryFn: () => fetchFolderMeasure(path ?? ''),
    enabled: path !== null,
    retry: false,
    staleTime: 30_000,
  });

/**
 * What inside the libraries is named with some words, below a folder, for the file manager.
 *
 * @param words - What the names should hold.
 * @param within - The folder to look below, or nothing for every library.
 * @returns The query.
 */
const libraryFileSearch = (words: string, within: string | null) =>
  queryOptions({
    queryKey: [...ADMIN, 'files', within, 'search', words],
    queryFn: () => searchLibraryFiles(words, within),
    retry: false,
  });

/**
 * Everywhere one account is signed in, for the admin dialog's Devices tab.
 *
 * @param accountId - The account being looked at, or null where none is open.
 * @returns The query.
 */
const accountSessions = (accountId: string | null) =>
  queryOptions({
    queryKey: [...ADMIN, 'accountSessions', accountId],
    queryFn: () => fetchAccountSessions(accountId ?? ''),
    enabled: accountId !== null,
  });

/**
 * Which accounts already have one thing allowed or denied, for the dialog that decides about it.
 *
 * @param subject - The item or programme, or nothing while none is being decided about.
 * @returns The query.
 */
const exceptionsOn = (subject: { kind: 'item' | 'series'; subjectId: string } | null) =>
  queryOptions({
    queryKey: [...ADMIN, 'exceptionsOn', subject?.kind ?? null, subject?.subjectId ?? null],
    queryFn: () => fetchExceptionsOn(subject ?? { kind: 'item', subjectId: '' }),
    enabled: subject !== null,
  });

/**
 * Every re-encode, including the ones waiting for somebody to judge them.
 *
 * Asked for again while anything is still being written, because an encode reports its progress by
 * writing it down rather than by announcing it — so a page that asked once shows the bar where it
 * was when the page opened, and only moves when somebody reloads.
 *
 * It stops asking once nothing is running. A queue that has been empty since Tuesday is not worth a
 * request every two seconds, and what remains — encodes waiting to be judged — changes only when
 * somebody judges one.
 *
 * @returns The query.
 */
const reencodes = () =>
  queryOptions({
    queryKey: [...ADMIN, 'reencodes'],
    queryFn: () => fetchReencodes(),
    refetchInterval: ({ state }) => whenToAskAgain(state.data ?? []),
  });

/**
 * What is kept beside one item.
 *
 * @param mediaId - The item, or nothing while none is being looked at.
 * @returns The query.
 */
const renditions = (mediaId: string | null) =>
  queryOptions({
    queryKey: [...ADMIN, 'renditions', mediaId],
    queryFn: () => fetchRenditions(mediaId ?? ''),
    enabled: mediaId !== null,
  });

/**
 * The pre-transcoding settings and how far it has got, asked for again while a copy is being made
 * so its bar moves.
 *
 * @returns The query.
 */
const preTranscoding = () =>
  queryOptions({
    queryKey: [...ADMIN, 'preTranscoding'],
    queryFn: () => fetchPreTranscoding(),
    refetchInterval: ({ state }) =>
      whenToAskAgain(
        state.data?.current === undefined || state.data.current === null
          ? []
          : [state.data.current],
      ),
  });

/**
 * How Valence sends email, and the emails it has tried lately.
 *
 * @returns The query.
 */
const emailSetup = () =>
  queryOptions({
    queryKey: [...ADMIN, 'email'],
    queryFn: () => fetchEmailSetup(),
  });

const adminQueries = {
  emailSetup,
  everyFile,
  preTranscoding,
  mediaPaths,
  reencodes,
  renditions,
  exceptionsOn,
  libraryAccess,
  folders,
  folderSearch,
  libraryFolder,
  folderMeasure,
  libraryFileSearch,
  overview,
  scans,
  monitor,
  sessions,
  jobs,
  jobHistory,
  recentFailures,
  jobHistoryIssues,
  jobStats,
  jobRun,
  logs,
  logPages,
  logHistogram,
  logFacets,
  resourceHistory,
  schedules,
  accounts,
  accountList,
  roles,
  permissions,
  accountPermissions,
  accountSessions,
  webhooks,
  linking,
  linkActivity,
  linkSharing,
  remotePeople,
  theirActivity,
  theirLibraries,
  deliveries,
  albums,
  books,
  shares,
  key: ADMIN,
};

export { adminQueries };
