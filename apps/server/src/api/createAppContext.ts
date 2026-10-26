import { saying } from '@ValenceI18n/saying';
import { notifyHousehold } from '@ValenceServer/notifications/notifyHousehold';
import { describeDevice } from '@ValenceCore/functions/describeDevice';
import { askerFieldsOf } from '@ValenceServer/webhooks/askerFieldsOf';
import { narrationOfSeries } from '@ValenceServer/requests/audible/narrationOfSeries';
import { createInertBucketMounts } from '@ValenceServer/buckets/createInertBucketMounts';
import { randomBytes } from 'node:crypto';
import { LibraryLocksSchema } from '@ValenceContracts/schemas/LibraryLock';
import { unlockedLibraries } from '@ValenceServer/locks/unlockedLibraries';
import { cookieOf } from '@ValenceServer/locks/cookieOf';
import { UNLOCKED_COOKIE } from '@ValenceServer/locks/UNLOCKED_COOKIE';
import { createMemoryPictureStore } from '@ValenceServer/pictures/createMemoryPictureStore';
import { brandLogoAddress } from '@ValenceServer/brand/brandLogoAddress';
import { BRAND_LOGO_LIMITS } from '@ValenceServer/brand/BRAND_LOGO_LIMITS';
import { heldAlbumsOf } from '@ValenceServer/requests/arrivals/heldAlbumsOf';
import { createMemoryCalendarFeedService } from '@ValenceServer/calendarFeed/createMemoryCalendarFeedService';
import type { Asker } from '@ValenceServer/api/Asker';
import { createLinkService } from '@ValenceServer/linking/createLinkService';
import { createMemoryLinkStore } from '@ValenceServer/linking/createMemoryLinkStore';
import { createPeerClient } from '@ValenceServer/linking/createPeerClient';
import { createLinkSharingService } from '@ValenceServer/linking/createLinkSharingService';
import { createMemoryLinkSharingStore } from '@ValenceServer/linking/createMemoryLinkSharingStore';
import { createPeerClaims } from '@ValenceServer/linking/createPeerClaims';
import { createPersonScope } from '@ValenceServer/linking/content/createPersonScope';
import { linkSettingsOf } from '@ValenceServer/linking/linkSettingsOf';
import { bodyOf } from '@ValenceI18n/bodyOf';
import { refuseWith } from '@ValenceI18n/refuseWith';
import type { RefusalBody } from '@ValenceI18n/RefusalBody';
import { commitThisIsRunning } from '@ValenceServer/about/commitThisIsRunning';
import { z } from '@hono/zod-openapi';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import { readViewer } from '@ValenceServer/visibility/readViewer';
import { readActing as readActingFor } from '@ValenceServer/profiles/acting/readActing';
import { narrowToProfile } from '@ValenceServer/profiles/acting/narrowToProfile';
import { createMemoryChosenProfiles } from '@ValenceServer/profiles/createMemoryChosenProfiles';
import { createMemoryProfileLimits } from '@ValenceServer/profiles/limits/createMemoryProfileLimits';
import { createProfileManagement } from '@ValenceServer/profiles/management/createProfileManagement';
import { createAccountFaces } from '@ValenceServer/household/createAccountFaces';
import { subjectOfRequest } from '@ValenceServer/visibility/subjectOfRequest';
import type { Subject } from '@ValenceServer/visibility/subjectOfRequest';
import type { Context, MiddlewareHandler } from 'hono';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { createMemoryHiddenService } from '@ValenceServer/hiding/createMemoryHiddenService';
import { createPresenceService } from '@ValenceServer/presence/PresenceService';
import type { LibraryEntryChange } from '@ValenceServer/files/LibraryEntryChange';
import { createUploadSessions } from '@ValenceServer/uploads/createUploadSessions';
import { createUploadDisk } from '@ValenceServer/uploads/createUploadDisk';
import type { UploadRefusal } from '@ValenceServer/uploads/UploadDisk';
import { createFolderDisk } from '@ValenceServer/folders/createFolderDisk';
import { tooBigToRead } from '@ValenceServer/api/tooBigToRead';
import { createMemorySplashscreenStore } from '@ValenceServer/splashscreen/createMemorySplashscreenStore';
import { JOB_DEFINITIONS } from '@ValenceServer/jobs/jobDefinitions';
import type { RequestsAnswer, RequestsClient } from '@ValenceServer/requests/createRequestsClient';
import { createMemoryStatisticsService } from '@ValenceServer/statistics/createMemoryStatisticsService';
import { createMemoryAuditService } from '@ValenceServer/audit/createMemoryAuditService';
import type { AuditRecording } from '@ValenceServer/audit/AuditService';
import { readNoLibraryHealth } from '@ValenceServer/health/readNoLibraryHealth';
import { createUpdateChecker } from '@ValenceServer/updates/createUpdateChecker';
import type { AuditAction } from '@ValenceContracts/schemas/Audit';
import { createMemoryMaintenanceService } from '@ValenceServer/maintenance/createMemoryMaintenanceService';
import { createMemoryJobScheduleService } from '@ValenceServer/jobs/createMemoryJobScheduleService';
import { createPhoneHandBacks } from '@ValenceServer/phone/createPhoneHandBacks';
import { checkAccountAction } from '@ValenceServer/auth/checkAccountAction';
import type { AccountActionRefusal } from '@ValenceServer/auth/checkAccountAction';
import type { RoleChangeRefusal } from '@ValenceServer/auth/checkRoleChange';
import { SEES_EVERY_REQUEST } from '@ValenceContracts/schemas/Permission';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createBetterAuthApiKeyService } from '@ValenceServer/auth/createBetterAuthApiKeyService';
import { createMemoryWebhookStore } from '@ValenceServer/webhooks/createMemoryWebhookStore';
import { createMemoryNotificationStore } from '@ValenceServer/notifications/createMemoryNotificationStore';
import { narrowToKey } from '@ValenceServer/auth/narrowToKey';
import { isDemoAccount } from '@ValenceServer/demo/isDemoAccount';
import { withholdFromTheDemo } from '@ValenceServer/demo/withholdFromTheDemo';
import { readSessionOnce } from '@ValenceServer/auth/readSessionOnce';
import type { WebhookOccurrence } from '@ValenceServer/events/EventBus';
import { MediaRequestAskSchema } from '@ValenceContracts/schemas/MediaRequest';
import type {
  MediaRequest,
  MediaRequestAsk,
  HeldInLibrary,
  MediaRequestDraft,
  MediaRequestKind,
  Narration,
  ReleaseType,
} from '@ValenceContracts/schemas/MediaRequest';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { bookAsTitle } from '@ValenceServer/requests/catalogue/discoverShelves';
import { standTitles } from '@ValenceServer/requests/catalogue/standTitles';
import { titleOfMusicHit } from '@ValenceServer/requests/catalogue/titleOfMusicHit';
import { missingAlbumsForPlugins } from '@ValenceServer/requests/missingAlbums/missingAlbumsForPlugins';
import type { UnstoodTitle } from '@ValenceServer/requests/catalogue/UnstoodTitle';
import type { PluginHost } from '@ValenceServer/plugins/broker/PluginHost';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { arrKindOf } from '@ValenceContracts/functions/arrKindOf';
import { isForLibrary, profilesOnOffer } from '@ValenceContracts/functions/profilesOnOffer';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import { libraryKindOf } from '@ValenceContracts/functions/libraryKindOf';
import { libraryKindsFor } from '@ValenceContracts/functions/libraryKindsFor';
import { catalogueForRequest } from '@ValenceServer/requests/catalogueForRequest';
import { heldInLibraryOf } from '@ValenceServer/requests/arrivals/heldInLibraryOf';
import { workOf } from '@ValenceServer/requests/workOf';
import type { RequestsOverview } from '@ValenceContracts/schemas/Requests';
import { NO_DISCOVERY } from '@ValenceServer/requests/catalogue/NO_DISCOVERY';
import { NO_EMAIL } from '@ValenceServer/email/NO_EMAIL';
import { NO_SUBTITLE_FINDER } from '@ValenceServer/subtitles/finding/NO_SUBTITLE_FINDER';
import type { Library, LibraryKind } from '@ValenceContracts/schemas/Library';
import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';
import type { GrantedPermission, Permission } from '@ValenceContracts/schemas/Permission';
import type { CreateAppOptions } from '@ValenceServer/api/CreateAppOptions';
import { refuse } from '@ValenceI18n/refuse';
import { whyRequestsCannotBeMadeNow } from '@ValenceServer/requests/whyRequestsCannotBeMadeNow';
import { say } from '@ValenceI18n/say';
import { createWebhookRequestReader } from '@ValenceServer/webhooks/createWebhookRequestReader';

const SHARE_JOINER = 'valence_share_joiner';

const GUEST_REMEMBERED_FOR_SECONDS = 30 * 86_400;

/**
 * Picks the headers worth carrying from a media file the server is forwarding — the type, the
 * length, the range it answered with — and leaves the rest behind rather than passing an upstream
 * response's headers through wholesale.
 *
 * @param file - The response from the file or the media service.
 * @param extra - Anything to add on top.
 * @returns The headers to answer with.
 */
const forwardedFileHeaders = (
  file: { contentType: string; contentRange: string | null; contentLength: string | null },
  extra: Record<string, string> = {},
): Record<string, string> => {
  const headers: Record<string, string> = {
    'content-type': file.contentType,
    'accept-ranges': 'bytes',
    ...extra,
  };

  if (file.contentRange !== null) {
    headers['content-range'] = file.contentRange;
  }

  if (file.contentLength !== null) {
    headers['content-length'] = file.contentLength;
  }

  return headers;
};

/**
 * Tells a client never to keep a session's segments.
 *
 * A session is named by a hash of what was asked for, and that hash says nothing about how the
 * segments were muxed. Change the muxer and the same address answers with different bytes — which
 * is not a theory: it happened during VAL-145, where a browser went on playing segments produced
 * before a fix because it had them already. Sessions are short-lived and their segments are read
 * once, so there is nothing to gain by keeping them and a stale film to lose.
 *
 * @returns The header that stops it being stored at all.
 */
const neverKeep = (): Record<string, string> => ({ 'cache-control': 'no-store' });

const SignInBodySchema = z.object({ password: z.string().min(1) });

const OVERVIEW_PATIENCE_MILLISECONDS = 5_000;

const NOT_STOOD: CatalogueStanding = {
  status: 'askable',
  mediaId: null,
  requestId: null,
  requestState: null,
};

const LIBRARY_KIND_WORDS: Record<LibraryKind, string> = {
  movies: 'films',
  shows: 'series',
  anime: 'anime',
  music: 'music',
  books: 'books',
};

const within = async <Answer>(work: Promise<Answer>, fallback: Answer): Promise<Answer> =>
  Promise.race([
    work,
    new Promise<Answer>((resolve) => {
      setTimeout(() => {
        resolve(fallback);
      }, OVERVIEW_PATIENCE_MILLISECONDS).unref();
    }),
  ]);

/**
 * What to tell somebody whose action on an account was refused.
 */
const describeAccountRefusal = (refusal: AccountActionRefusal): RefusalBody =>
  refusal === 'self'
    ? refuse('server.appContext.youCannotDoThatToYour')
    : refuse('server.appContext.thatAccountIsAtOrAbove');

/**
 * What to tell somebody whose change to a role was refused.
 */
const describeRefusal = (refusal: RoleChangeRefusal): RefusalBody =>
  refusal === 'outranked'
    ? refuse('server.appContext.thatRoleIsAtOrAbove')
    : refuse('server.appContext.youCannotGrantAPermissionYou');

/**
 * Builds the Valence HTTP application.
 */

/**
 * Everything the server's endpoints are answered with: the services and settings it was built
 * with, and the helpers every area shares — who is asking and what they may do, what is out of
 * their reach, how a refusal is worded — made once, before any endpoint is registered.
 *
 * @param options - What the server was built with.
 * @returns The context each area's endpoints read from.
 */
const createAppContext = (options: CreateAppOptions) => {
  const {
    auth,
    settings,
    version: SERVER_VERSION = '0.0.0',
    commit: givenCommit,
    trustedOrigins,
    callerOf,
    demoAccounts = [],
    countUsers,
    promoteToAdmin,
    library,
    playback,
    maintenance = createMemoryMaintenanceService(),
    schedules = createMemoryJobScheduleService(),
    presence = createPresenceService(),
    subtitles,
    subtitleFonts,
    segments,
    progress,
    downloads,
    favourites,
    liveTv,
    hiding = createMemoryHiddenService(),
    ratings,
    shares,
    shareSessions,
    calendarFeeds = createMemoryCalendarFeedService(),
    playbackSessions,
    profiles,
    households,
    splashscreen = createMemorySplashscreenStore(),
    unlockSecret = randomBytes(32).toString('hex'),
    chosenProfiles = createMemoryChosenProfiles(),
    profileLimits = createMemoryProfileLimits(),
    buckets = createInertBucketMounts(),
    brandLogo = createMemoryPictureStore({
      prefix: 'brand-logo',
      address: brandLogoAddress,
      limits: BRAND_LOGO_LIMITS,
    }),
    books,
    streamBookFile,
    music,
    collections,
    videoDevices,
    bookDevices,
    reencodes,
    onReencodeQueued,
    preTranscoding,
    promoteProfile,
    discordIdOf,
    listUsers,
    capabilities,
    hardware,
    testHardware,
    folderReach,
    artworkUsage,
    bookPageUsage,
    libraryBytes,
    measureStorage,
    monitor,
    stalledJobs,
    readImage,
    isTranscoderReachable = () => Promise.resolve(false),
    folderDisk = createFolderDisk(),
    uploadDisk = createUploadDisk(),
    uploadSessions = createUploadSessions(),
    transcoderAddress = '',
    listRunningJobs = () => [],
    jobDefinitions = JOB_DEFINITIONS,
    requests = null,
    requestsClient = null,
    cancelJob = () => Promise.resolve(false),
    controlQueue = null,
    searchCatalogue = () => Promise.resolve([]),
    describeForRequest = () => Promise.resolve(null),
    describeMusicForRequest = () => Promise.resolve(null),
    describeBookForRequest = () => Promise.resolve(null),
    describeBookSeriesForRequest = () => Promise.resolve(null),
    searchMusicCatalogue = () => Promise.resolve([]),
    missingAlbums = null,
    discovery = NO_DISCOVERY,
    permissions = createMemoryPermissionService(),
    history,
    statistics: givenStatistics,
    audit = createMemoryAuditService(),
    backups,
    readLibraryHealth = readNoLibraryHealth,
    updates: givenUpdates,
    apiKeys = createBetterAuthApiKeyService(auth),
    webhooks = createMemoryWebhookStore(),
    linking: linkingOptions,
    notifications = createMemoryNotificationStore(),
    readPushPublicKey = () => Promise.resolve(''),
    queueWebhookDelivery = () => Promise.resolve(),

    banAccount,
    unbanAccount,
    removeAccount,
    isAccountBanned,
    readBanReason,
    editAccount,
    setupLinks,
    createAccountWithoutPassword,
    resetAccountPassword,
    listAccountSessions,
    endAccountSessions,
    endAccountSession,
    realtime,
    logs,
    log,
    jobHistory,
    resourceHistory,
    events,
    sayALinkWasWithdrawn,
    onNamesChanged,
    plugins: startPlugins,
    email = NO_EMAIL,
    subtitleFinder = NO_SUBTITLE_FINDER,
    requestPasswordReset = () => Promise.resolve(),
  } = options;

  const linkStore = linkingOptions?.store ?? createMemoryLinkStore();
  const peerClaims = createPeerClaims();
  const peerRequests = new WeakSet<Headers>();
  const linkPeople = linkingOptions?.people ?? createPersonScope();
  const linkSharingStore =
    linkingOptions?.sharing ??
    createMemoryLinkSharingStore(async (id) => (await linkStore.readServer(id)) !== null);
  const peers = linkingOptions?.peers ?? createPeerClient();
  const linking =
    linkingOptions?.service ??
    createLinkService({
      store: linkStore,
      settings: linkSettingsOf(settings),
      address: linkingOptions?.address ?? 'http://localhost:8420',
      defaultName: linkingOptions?.defaultName ?? say('common.valence'),
      peers,
    });
  const linkSharing = createLinkSharingService({
    linking,
    links: linkStore,
    sharing: linkSharingStore,
    libraries: async () =>
      (await library.list(asTheServer))
        .filter((shelf) => (shelf.linkedServerId ?? null) === null)
        .map(({ id, name, kind }) => ({ id, name, kind })),
    subjectOf:
      linkingOptions?.subjectOf ??
      (async (subject) => {
        const item = subject.kind === 'item' ? await library.getMedia(subject.id) : null;

        return item === null
          ? null
          : {
              id: item.id,
              title: item.title,
              libraryId: item.libraryId,
              certificationAge: null,
              isNeverRated: false,
            };
      }),
    claims: peerClaims,
    peers,
    ...(linkingOptions?.warn === undefined ? {} : { warn: linkingOptions.warn }),
  });

  /**
   * Says that somebody was given or lost a role, once the change has actually stuck.
   *
   * @param userId - Whose roles changed.
   * @param role - The role that moved.
   * @param change - Whether they gained it or lost it.
   */
  const sayRoleChanged = async (
    userId: string,
    role: string,
    change: 'given' | 'taken',
  ): Promise<void> => {
    if (events === undefined) {
      return;
    }

    const named = ((await listUsers?.()) ?? []).find((one) => one.id === userId);

    void events.publish({
      event: 'account.roleChanged',
      data: { accountId: userId, name: named?.name ?? say('common.somebody'), role, change },
    });
  };

  /**
   * Which account is signed in and which of its profiles is acting for it.
   */
  const readActing = (headers: Headers) =>
    readActingFor(
      { auth, chosen: chosenProfiles, ...(profiles === undefined ? {} : { profiles }) },
      headers,
    );

  /**
   * Everything whoever is asking may do, including what plugins registered, less what a shared demo
   * account may never do, and narrowed to what an API key was restricted to where they are asking
   * with one.
   */
  const grantsOf = async (headers: Headers): Promise<ReadonlySet<GrantedPermission>> => {
    const session = await readSessionOnce(auth, headers);
    const acting = await readActing(headers);

    if (session === null || acting === null) {
      return new Set();
    }

    const resolved = narrowToProfile(await permissions.resolve(session.user.id), acting);
    const held = isDemoAccount(session.user, demoAccounts)
      ? withholdFromTheDemo(resolved)
      : resolved;

    if (!acting.isViaKey) {
      return held;
    }

    return narrowToKey(held, await apiKeys.restrictionFor(headers, session.session.id));
  };

  /**
   * Whether whoever is asking holds a particular permission.
   */
  const requires = async (headers: Headers, permission: Permission): Promise<boolean> =>
    (await grantsOf(headers)).has(permission);

  /**
   * Whether whoever is asking is signed in to one of the shared demo accounts named in DEMO_ACCOUNTS.
   */
  const isOnTheDemo = async (headers: Headers): Promise<boolean> => {
    const session = await readSessionOnce(auth, headers);

    return session !== null && isDemoAccount(session.user, demoAccounts);
  };

  /**
   * Somebody asking, as whatever the request carries says: its session, narrowed by any key.
   */
  const askerOf = (headers: Headers): Asker => ({
    account: async () => (await readSessionOnce(auth, headers))?.user ?? null,
    holds: (permission) => requires(headers, permission),
    askingProfile: async () => {
      const profile = (await readActing(headers))?.profile ?? null;

      return profile === null ? null : { profileId: profile.id, name: profile.name };
    },
  });

  /**
   * What a profile on an account may do: everything the account holds for its owner, less for
   * anybody else on it. Where no profile is named, the account as a whole.
   *
   * @param accountId - Whose account.
   * @param profileId - Which profile on it, where one is known.
   * @returns What it may do.
   */
  const permissionsOfProfile = async (
    accountId: string,
    profileId: string | null,
  ): Promise<ReadonlySet<GrantedPermission>> => {
    const held = await permissions.resolve(accountId);

    if (profileId === null || profiles === undefined) {
      return held;
    }

    const standing = await profiles.standingOf(profileId);

    return narrowToProfile(held, {
      mustChoose: standing === null || standing.userId !== accountId,
      profile: standing,
    });
  };

  /**
   * Somebody asking without a request of their own — a plugin acting for one of its people, or a
   * calendar feed — with exactly what their profile on the account holds.
   */
  const askerFor = (
    account: { id: string; name: string },
    profileId: string | null = null,
  ): Asker => ({
    account: () => Promise.resolve(account),
    holds: async (permission) =>
      (await permissionsOfProfile(account.id, profileId)).has(permission),
    askingProfile: async () => {
      const standing =
        profileId === null ? null : ((await profiles?.standingOf(profileId)) ?? null);

      return standing === null ? null : { profileId: standing.id, name: standing.name };
    },
  });

  const faces = households === undefined ? undefined : createAccountFaces({ households, profiles });

  /**
   * What a household is called, for whoever asked on its behalf.
   *
   * @param account - The account.
   * @returns Its household's name.
   */
  const householdNameFor = async (account: { id: string; name: string }): Promise<string> =>
    (await faces?.read(account.id, account.name))?.name ?? account.name;

  /**
   * Whoever is asking, from a request's headers or as they were already worked out.
   */
  const asAsker = (who: Headers | Asker): Asker => (who instanceof Headers ? askerOf(who) : who);

  /**
   * Who a request is for, as both the account it belongs to and the person watching.
   *
   * Everything that decides what may be seen asks this rather than asking for one or the other: the
   * account carries what an administrator enforced, the profile carries what the viewer chose for
   * themselves, and keeping them together is what stops the two being confused.
   *
   * @param headers - The request's headers.
   * @returns Who it is for, or nothing where nobody is signed in.
   */
  const lockedLibraries = async (headers: Headers, holder: string): Promise<string[]> => {
    const locks = LibraryLocksSchema.catch({}).parse((await settings.read()).libraryLocks);
    const lockedIds = Object.keys(locks);

    if (lockedIds.length === 0) {
      return [];
    }

    const unlocked = unlockedLibraries(
      cookieOf(headers, UNLOCKED_COOKIE) ?? '',
      holder,
      locks,
      unlockSecret,
      Date.now(),
    );

    return lockedIds.filter((libraryId) => !unlocked.has(libraryId));
  };

  const viewerOf = (headers: Headers): Promise<Viewer | null> =>
    peerRequests.has(headers)
      ? Promise.resolve(asTheServer)
      : readViewer({ acting: readActing, grants: grantsOf, lockedLibraries }, headers);

  /**
   * Whether the person asking may open a book, and — where a chapter is named — whether that chapter
   * is in it. A book's library being refused or hidden puts the book out of reach, and asking for a
   * chapter through a book it does not belong to is refused rather than served. A guest has already
   * been held to what was shared with them by the time this is asked.
   *
   * @param headers - The request's headers.
   * @param bookId - The book.
   * @param chapterId - A chapter in it, where the request names one.
   * @returns Whether to serve it.
   */
  const bookInReach = async (
    headers: Headers,
    bookId: string,
    chapterId?: string,
  ): Promise<boolean> =>
    books !== undefined && books.canReach(await viewerOf(headers), bookId, chapterId);

  /**
   * Whether an account was refused the library something sits in.
   *
   * The cheap question is asked first and is usually the only one. Every poster and backdrop on a
   * page arrives as a request of its own, so the common answer — nothing is refused — costs a single
   * indexed lookup. Who is an administrator is worked out only once something has actually been
   * refused, which is rare, rather than on each of the fifty images a library page draws.
   *
   * @param viewer - Who is asking, as their account and the profile acting for it.
   * @param subject - The item or programme in question.
   * @returns Whether to refuse it.
   */
  const isOutOfReach = async (viewer: Viewer | null, subject: Subject): Promise<boolean> => {
    if (subject.kind === 'none' || viewer === null) {
      return false;
    }

    return subject.kind === 'item'
      ? library.isOutOfReach(viewer, subject.mediaId)
      : library.isSeriesOutOfReach(viewer, subject.seriesId);
  };

  /**
   * Refuses anything a viewer's account may not reach, before the route that would answer it runs.
   *
   * This is the one gate every address naming an item passes through, which is the point: three
   * separate features want content kept out of sight, and a check written into each handler is a
   * check missing from the next handler somebody writes. Reading the subject from the address means
   * a route added later is covered on the day it is written.
   *
   * It asks only what the account may reach, never what the viewer has hidden. Hiding is a
   * preference and tidies a view; it was never meant to lock a door, and somebody following a link
   * to something they hid should still arrive at it. Refusing here would quietly turn hiding into
   * enforcement, which is the one thing both tickets behind this asked not to happen.
   *
   * The cheap question is asked first and is usually the only one. Every poster and backdrop on a
   * page comes through here as a request of its own, so the common answer — nothing is refused —
   * costs a single indexed lookup. Who is an administrator is worked out only once something has
   * actually been refused, which is rare, rather than on each of the fifty images a library page
   * draws.
   *
   * It answers as though the thing were not there, in the same words an item that never existed
   * gets, because being told something exists is most of what was being kept back.
   *
   * A request with nobody signed in is left alone. The session gate has already turned away anyone
   * who is neither signed in nor holding a live share link, so what arrives here without a session
   * is a share guest, and what a share reaches was settled when the link was made.
   *
   * @param context - The request.
   * @param next - The route that would answer it.
   * @returns A refusal, or whatever the route answers.
   */
  const refuseWhatIsOutOfReach: MiddlewareHandler = async (context, next) => {
    const subject = subjectOfRequest(context.req.path);

    if (subject.kind === 'none') {
      return next();
    }

    const headers = context.req.raw.headers;
    const acting = await readActing(headers);

    if (acting === null) {
      return next();
    }

    const asAnybody: Viewer = {
      kind: 'account',
      accountId: acting.account.id,
      profileId: acting.profile?.id ?? null,
      isAdministrator: false,
    };

    if (
      (await isOutOfReach(asAnybody, subject)) &&
      (await isOutOfReach(await viewerOf(headers), subject))
    ) {
      return context.json(refuse('error.common.noSuchItem'), 404);
    }

    return next();
  };

  /**
   * What to say about a change to a library's files that did not happen, and with which status.
   *
   * @param change - Why it did not.
   * @returns The words and the status.
   */
  const sayWhyUnchanged = (change: Exclude<LibraryEntryChange, { kind: 'changed' }>) => {
    switch (change.kind) {
      case 'outside':
        return { ...refuse('error.common.thatIsNotInsideALibrary'), status: 403 } as const;
      case 'root':
        return {
          ...refuse('error.server.thatIsALibrarysOwnFolder'),
          status: 400,
        } as const;
      case 'exists':
        return {
          ...refuse('error.server.somethingOfThatNameIsAlready'),
          status: 409,
        } as const;
      case 'badName':
        return {
          ...refuse('error.server.aNameIsOnePlainName'),
          status: 400,
        } as const;
      case 'intoItself':
        return {
          ...refuse('error.server.aFolderCannotBeMovedInto'),
          status: 400,
        } as const;
      case 'otherDisk':
        return {
          ...refuse('error.server.thatWouldMoveItOntoAnother'),
          status: 400,
        } as const;
      case 'missing':
        return { ...refuse('error.server.thereIsNothingThere'), status: 404 } as const;
      case 'readOnly':
        return {
          ...refuse('error.server.thatDiskIsReadOnlyTo3'),
          status: 403,
        } as const;
      case 'denied':
        return {
          ...refuse('error.server.valenceIsNotAllowedToChange'),
          status: 403,
        } as const;
      case 'failed':
        return { ...refuse('error.common.thatCouldNotBeDone'), status: 500 } as const;
    }
  };

  /**
   * Settles a change to a library's files: where it worked, each library it touched is asked to
   * scan so the catalogue follows what is now on the disk; where it did not, what to say.
   *
   * @param change - What happened.
   * @returns Where it is now, or the words and status to refuse with.
   */
  const settleChange = async (
    change: LibraryEntryChange,
  ): Promise<{ path: string } | (RefusalBody & { status: 400 | 403 | 404 | 409 | 500 })> => {
    if (change.kind !== 'changed') {
      return sayWhyUnchanged(change);
    }

    await Promise.all(change.libraryIds.map((libraryId) => library.scan(libraryId)));

    return { path: change.path };
  };

  /**
   * The library an upload is for, where the one asking may edit libraries and can see it.
   *
   * @param headers - The request's headers, for who is asking.
   * @param libraryId - The library.
   * @returns The library, or why not.
   */
  const libraryToUploadInto = async (headers: Headers, libraryId: string) => {
    if (!(await requires(headers, 'library.edit'))) {
      return { kind: 'forbidden' } as const;
    }

    const viewer = await viewerOf(headers);

    if (viewer === null) {
      return { kind: 'signedOut' } as const;
    }

    const target = (await library.list(viewer)).find((entry) => entry.id === libraryId);

    return target === undefined
      ? ({ kind: 'missing' } as const)
      : ({ kind: 'found', target } as const);
  };

  /**
   * What to say where the disk would not take an upload, and with which status.
   *
   * @param refusal - What the disk refused.
   * @returns The words and the status.
   */
  const sayRefused = (refusal: UploadRefusal) =>
    refusal.kind === 'readOnly'
      ? ({
          ...refuse('error.server.thatDiskIsReadOnlyTo2'),
          status: 403,
        } as const)
      : refusal.kind === 'denied'
        ? ({
            ...refuse('error.server.valenceIsNotAllowedToWrite'),
            status: 403,
          } as const)
        : ({ ...refuse('error.server.theFileCouldNotBeWritten'), status: 500 } as const);

  /**
   * Throws away the staging files of uploads left untouched for long enough to count as abandoned,
   * whenever somebody is uploading, so nothing keeps a timer for them.
   */
  const sweepAbandonedUploads = async () => {
    await Promise.all(
      (await uploadSessions.stale()).map((session) => uploadDisk.discard(session.staging)),
    );
  };

  /**
   * What to say where the disk would not give up a file, and with which status.
   *
   * @param refusal - Why it would not.
   * @returns The words and the status.
   */
  const sayWhyNotDeleted = (refusal: { kind: 'outside' | 'readOnly' | 'denied' | 'failed' }) => {
    switch (refusal.kind) {
      case 'outside':
        return {
          ...refuse('error.server.thatFileIsNotInsideIts'),
          status: 403,
        } as const;
      case 'readOnly':
        return {
          ...refuse('error.server.thatDiskIsReadOnlyTo'),
          status: 403,
        } as const;
      case 'denied':
        return {
          ...refuse('error.server.valenceIsNotAllowedToDelete'),
          status: 403,
        } as const;
      case 'failed':
        return { ...refuse('error.common.theFileCouldNotBeDeleted'), status: 500 } as const;
    }
  };

  /**
   * The profile an account's face is drawn from: the first on it, where it has any.
   */
  const profileOfAccount = async (accountId: string): Promise<string | null> => {
    const held = profiles === undefined ? [] : await profiles.list(accountId);

    return (held.find((profile) => profile.isOwner) ?? held[0])?.id ?? null;
  };

  /**
   * Which person on this account is watching.
   */
  const readProfileId = async (headers: Headers): Promise<string | null> =>
    (await readActing(headers))?.profile?.id ?? null;

  /**
   * Tells every tab on an account that its profiles have changed, so a rename or a new picture shows
   * on the other devices that person is signed in on rather than waiting for a reload.
   *
   * Told to everybody rather than to one account where the way in draws the household's faces,
   * because then a face is not private to the account that owns it: every other household holds it
   * in a cache keyed by when it last changed, and telling nobody leaves them all showing a face its
   * owner replaced until something else happens to make them ask again.
   *
   * @param accountId - Whose profiles changed.
   */
  const announceProfiles = async (accountId: string): Promise<void> => {
    onNamesChanged?.();
    realtime?.publish(
      'profile',
      { changed: true },
      (await settings.read()).showsProfilesBeforeSignIn
        ? { kind: 'everyone' }
        : { kind: 'accounts', accountIds: [accountId] },
    );
  };

  const profileManagement =
    profiles === undefined
      ? undefined
      : createProfileManagement({
          profiles,
          limits: profileLimits,
          chosen: chosenProfiles,
          library,
          checkPassword: async (accountId, password) =>
            (
              await auth.api
                .checkThePassword({ body: { userId: accountId, password } })
                .catch(() => ({ isRight: false }))
            ).isRight,
          announce: announceProfiles,
          ...(faces === undefined ? {} : { onSecondProfile: faces.forgetOwn }),
          onRemoved: (profileId) => {
            plugins?.profilesRemoved([profileId]);
          },
          onChosen: (acting, profile, device) => {
            void (async () => {
              await events?.publish({
                event: 'profile.chosen',
                data: {
                  accountId: acting.account.id,
                  accountName: await householdNameFor(acting.account),
                  profileId: profile.id,
                  profileName: profile.name,
                  deviceLabel: describeDevice(device.userAgent, device.brands).message,
                  address: device.address,
                },
              });
            })();
          },
          onPinLocked: (accountId, profileName) => {
            void (async () => {
              const owner = (await profiles.list(accountId)).find((one) => one.isOwner);

              await notifyHousehold({
                store: notifications,
                event: 'profiles.pinLocked',
                title: saying('server.profiles.aPinWasGuessedWrong', { name: profileName }),
                body: saying('server.profiles.somebodyGotNamesPinWrong', { name: profileName }),
                link: null,
                vapid: null,
                only: [accountId],
                ...(owner === undefined ? {} : { profilesOf: new Map([[accountId, [owner.id]]]) }),
              });
            })();
          },
        });

  /**
   * Who owns this server, or nothing where no owner has been recorded.
   *
   * An install from before ownership existed has none until it is settled at startup, and the rules
   * fall back to rank alone rather than to trusting anybody in particular.
   *
   * @returns The owning account's identifier, or null.
   */
  const theOwner = async (): Promise<string | null> => {
    const { ownerAccountId } = await settings.read();

    return ownerAccountId === '' ? null : ownerAccountId;
  };

  /**
   * Who is signed in, for the routes that act on their own account.
   */
  const readAccount = async (headers: Headers) =>
    (await readSessionOnce(auth, headers))?.user ?? null;

  const statistics = givenStatistics ?? createMemoryStatisticsService(history);

  const updates =
    givenUpdates ?? createUpdateChecker({ current: SERVER_VERSION, isEnabled: false });

  /**
   * Names an account for the audit log, by the name it goes by now.
   *
   * @param accountId - The account.
   * @returns Its name, or its id where it cannot be found.
   */
  const nameOfAccount = async (accountId: string): Promise<string> =>
    (await listUsers?.())?.find((user) => user.id === accountId)?.name ?? accountId;

  /**
   * Writes down who made a change to the server, for the audit log, naming whoever is asking and
   * where they asked from.
   *
   * @param asked - The request.
   * @param action - What was changed.
   * @param target - What it was changed on, by name.
   * @param detail - Anything else worth keeping about it.
   * @param recording - Whether a change made again straight after folds into this one.
   */
  const recordAudit = async (
    asked: Context,
    action: AuditAction,
    target: string | null = null,
    detail: Readonly<Record<string, string>> | null = null,
    recording: AuditRecording = {},
  ): Promise<void> => {
    const headers = asked.req.raw.headers;
    const account = await readAccount(headers);

    await audit.record(
      {
        actorId: account?.id ?? null,
        actorName: account?.name ?? '',
        action,
        target,
        detail,
        address: callerOf?.(asked) ?? null,
        userAgent: headers.get('user-agent'),
      },
      recording,
    );
  };

  /**
   * Whether a device named in a request may be spoken for by whoever is asking.
   *
   * A client identifier is a value the caller chooses, so a route acting on one has to ask whose it
   * is. Presence holds the answer, and holds it from the account its socket was authenticated as
   * rather than from anything a client sent.
   *
   * A device nobody is holding is nobody's to take, so it passes: a tab whose socket has not
   * identified yet goes on working, and a guest holding a share link has no account to match in the
   * first place. What is refused is a device somebody else is holding.
   *
   * @param headers - The request's headers, for reading who is asking.
   * @param clientId - The device named, where one was named at all.
   * @returns Whether the request may act on that device.
   */
  /**
   * Whether a playback session named in a request may be read by whoever is asking.
   *
   * A session identifier is the only thing a manifest's addresses carry, so a route serving one has
   * to ask whose viewing it is. What it protects is the viewing rather than the film: every
   * signed-in account may already read any item, so this keeps somebody's session from being
   * watched over their shoulder rather than keeping the catalogue shut.
   *
   * A session nobody is holding is nobody's to take, so it passes — a session started before this
   * server knew to record who started it goes on working. So does a guest holding a share link,
   * whose own gate has already checked that this share started this session.
   *
   * @param headers - The request's headers, for reading whose face is asking.
   * @param sessionId - The session named.
   * @returns Whether the request may read it.
   */
  /**
   * Who on this server a request is for, as a linked server would be told: the face watching, by
   * its name, or nobody where there is no face or no session.
   *
   * @param headers - The request's headers.
   * @returns The person, or nothing.
   */
  const linkPersonOf = async (headers: Headers) => {
    const account = await readAccount(headers);
    const profileId = account === null ? null : await readProfileId(headers);
    const face =
      account === null || profileId === null || profiles === undefined
        ? undefined
        : (await profiles.list(account.id)).find((profile) => profile.id === profileId);

    return face === undefined ? null : { profileId: face.id, name: face.name };
  };

  const isTheSessionOfWhoeverIsAsking = async (
    headers: Headers,
    sessionId: string,
  ): Promise<boolean> => {
    if (playbackSessions === undefined || !playbackSessions.isHeld(sessionId)) {
      return true;
    }

    const asking = await readProfileId(headers);

    return asking === null || playbackSessions.isClaimedBy(sessionId, asking);
  };

  const isTheDeviceOfWhoeverIsAsking = async (
    headers: Headers,
    clientId: string | undefined,
  ): Promise<boolean> => {
    const owner = clientId === undefined ? null : presence.ownerOf(clientId);

    if (owner === null) {
      return true;
    }

    return owner === (await readAccount(headers))?.id;
  };

  /**
   * Whoever is asking, if they may manage keys at all: somebody signed in who may hold them, never
   * something asking with a key.
   */
  const readKeyHolder = async (headers: Headers) => {
    const account = await readAccount(headers);

    if (account === null) {
      return { account: null, refusal: 'anonymous' } as const;
    }

    if ((await readActing(headers))?.isViaKey === true) {
      return { account: null, refusal: 'viaKey' } as const;
    }

    return (await requires(headers, 'account.keys'))
      ? ({ account, refusal: null } as const)
      : ({ account: null, refusal: 'forbidden' } as const);
  };

  /**
   * Whether this request may manage subscriptions, and why not if it may not.
   */
  const readWebhookKeeper = async (
    headers: Headers,
  ): Promise<'anonymous' | 'forbidden' | 'allowed'> => {
    const account = await readAccount(headers);

    if (account === null) {
      return 'anonymous';
    }

    return (await requires(headers, 'server.webhooks')) ? 'allowed' : 'forbidden';
  };

  const refuseWebhookKeeper = (keeper: 'anonymous' | 'forbidden') =>
    keeper === 'anonymous'
      ? ({ ...refuse('error.common.nobodyIsSignedIn'), status: 401 } as const)
      : ({
          ...refuse('error.server.thisAccountMayNotManageWebhooks'),
          status: 403,
        } as const);

  /**
   * Who is asking, and what they may do — resolved once for the role routes, which need both their
   * permissions and their rank.
   */
  const readActor = async (headers: Headers) => {
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return null;
    }

    const acting = await readActing(headers);
    const isTheOwner = acting !== null && !acting.mustChoose && (acting.profile?.isOwner ?? true);
    const held = isTheOwner ? await permissions.rolesFor(session.user.id) : [];

    return {
      id: session.user.id,
      permissions: await grantsOf(headers),
      highestPosition: held.length === 0 ? null : Math.max(...held.map((role) => role.position)),
    };
  };

  /**
   * Whether an account is at or above the actor's own rank, and so not theirs to change.
   *
   * Rank alone, where banning and removing also refuse somebody acting on their own account.
   * Changing what you hold yourself is a legitimate thing to do, and what stops the last
   * administrator undoing themselves is whether the change would strand the server rather than
   * whose account it is.
   *
   * @param actor - Who is asking, and how senior they are.
   * @param targetId - Whose account is being changed.
   * @param targetRoles - The roles that account holds.
   * @returns Whether to refuse.
   */
  const outranks = (
    actor: NonNullable<Awaited<ReturnType<typeof readActor>>>,
    targetId: string,
    targetRoles: readonly { position: number }[],
    ownerId: string | null,
  ): boolean =>
    checkAccountAction({
      actorId: actor.id,
      ownerId,
      actorHighestPosition: actor.highestPosition,
      targetId,
      targetHighestPosition:
        targetRoles.length === 0 ? null : Math.max(...targetRoles.map((role) => role.position)),
    }) === 'outranked';

  /**
   * Why somebody may not act on another account, by rank and by who owns the server, or nothing
   * where they may. Acting on your own account is never refused here.
   *
   * @param actor - Who is asking, and how senior they are.
   * @param targetId - Whose account.
   * @returns The refusal to answer with, or nothing.
   */
  const refusalOver = async (
    actor: NonNullable<Awaited<ReturnType<typeof readActor>>>,
    targetId: string,
  ): Promise<RefusalBody | null> => {
    if (actor.id === targetId) {
      return null;
    }

    const roles = await permissions.rolesFor(targetId);
    const refusal = checkAccountAction({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      targetId,
      targetHighestPosition:
        roles.length === 0 ? null : Math.max(...roles.map((role) => role.position)),
    });

    return refusal === null ? null : describeAccountRefusal(refusal);
  };

  /**
   * Whether taking something away would leave the server with nobody able to administer it.
   */
  const wouldStrandTheServer = async (apply: () => Promise<void>, undo: () => Promise<void>) => {
    const before = await permissions.countAdministrators();

    await apply();

    if (before === 0 || (await permissions.countAdministrators()) > 0) {
      return false;
    }

    await undo();

    return true;
  };

  /**
   * Whether this actor may decide what another account sees.
   *
   * The same two questions the rest of the accounts panel asks: holding the permission, and not
   * acting on somebody at or above your own rank. Without the second, a manager could quietly take
   * the library away from an administrator.
   *
   * @param headers - The request's headers.
   * @param userId - Whose access is being changed.
   * @returns Why they may not, or nothing where they may.
   */
  const mayDecideAccess = async (headers: Headers, userId: string): Promise<RefusalBody | null> => {
    const actor = await readActor(headers);

    if (actor === null || !actor.permissions.has('account.manage')) {
      return refuse('common.thatIsForAdministrators');
    }

    if (outranks(actor, userId, await permissions.rolesFor(userId), await theOwner())) {
      return describeAccountRefusal('outranked');
    }

    return null;
  };

  /**
   * What requesting is doing just now, read afresh alongside the overview the monitor keeps: what
   * waits on somebody, what is being fetched and how fast, and which download clients answer.
   *
   * @returns The overview, with the work in it.
   */
  const requestsOverview = async (): Promise<RequestsOverview | null> => {
    const latest = requests?.overview();

    if (latest === undefined) {
      return null;
    }

    if (requestsClient === null || !latest.isReachable) {
      return latest;
    }

    const [listed, queued] = await Promise.all([
      requestsClient.listRequests(),
      requestsClient.downloads(),
    ]);

    return {
      ...latest,
      work: workOf(
        listed.kind === 'answered' ? listed.value : [],
        queued.kind === 'answered' ? queued.value : null,
        new Date().toISOString().slice(0, DATE_LENGTH),
      ),
    };
  };

  const NOT_YOURS = refuse('error.common.thatIsForWhoeverSetsUp');

  const DATE_LENGTH = 10;

  /**
   * Asks the requests service again how it is, after an indexer changed, so that a warning about
   * one that was removed, turned back on or mended goes at once rather than at the next check.
   */
  const recheckRequests = async (): Promise<void> => {
    await requests?.check();
  };

  const REQUESTING_OFF = refuse('error.common.requestingIsOff');

  /**
   * Whether somebody may reach through to the requests service, and the client to do it with.
   *
   * @param who - Who is asking.
   * @returns The client, or why not.
   */
  const reachRequests = async (
    who: Headers | Asker,
    allowed: readonly Permission[] = ['requests.manage'],
  ): Promise<RequestsClient | 'refused' | 'off'> => {
    const asker = asAsker(who);

    for (const permission of allowed) {
      if (await asker.holds(permission)) {
        return requestsClient ?? 'off';
      }
    }

    return 'refused';
  };

  /**
   * Asks the requests service something on somebody's behalf, and says in one shape what came of
   * it: the answer, or the refusal and the status that fits it — not theirs to ask, requesting off,
   * the service refusing the question, or the service not heard at all.
   *
   * @param who - Who is asking.
   * @param ask - What to ask the service.
   * @param allowed - The permissions, any one of which lets them ask.
   * @returns The answer, or why not.
   */
  const throughRequests = async <Value>(
    who: Headers | Asker,
    ask: (client: RequestsClient) => Promise<RequestsAnswer<Value>>,
    allowed: readonly Permission[] = ['requests.manage'],
  ): Promise<
    | { kind: 'answered'; value: Value }
    | ({ kind: 'refused'; status: 400 | 403 | 404 | 502 } & RefusalBody)
  > => {
    const client = await reachRequests(who, allowed);

    if (client === 'refused') {
      return { kind: 'refused', status: 403, ...NOT_YOURS };
    }

    if (client === 'off') {
      return { kind: 'refused', status: 404, ...REQUESTING_OFF };
    }

    const answer = await ask(client);

    if (answer.kind === 'silent') {
      return { kind: 'refused', status: 502, ...refuseWith(answer.reason) };
    }

    return answer.kind === 'refused'
      ? { kind: 'refused', status: answer.status, ...answer.refusal }
      : answer;
  };

  const APPROVERS: readonly Permission[] = ['requests.approve', 'requests.manage'];

  const ASKERS: readonly Permission[] = ['requests.ask', 'requests.askMusic'];

  /**
   * The library a request of a kind would be filed into: the one asked for, or else the first that
   * takes requests of the best kind for it — anime into an anime library before the shows or films.
   *
   * @param kind - What is being asked for.
   * @param libraryId - The library asked for, where one was.
   * @param isAnime - Whether it is anime.
   * @returns The library, or nothing where none that could take it takes requests.
   */
  const libraryForRequest = async (kind: MediaRequestKind, libraryId?: string, isAnime = false) => {
    const kinds = libraryKindsFor(kind, isAnime);
    const libraries = (await library.list(asTheServer))
      .filter((entry) => kinds.includes(entry.kind) && entry.takesRequests)
      .toSorted((left, right) => kinds.indexOf(left.kind) - kinds.indexOf(right.kind));

    return libraryId === undefined
      ? libraries[0]
      : libraries.find((entry) => entry.id === libraryId);
  };

  /**
   * Whether the catalogue says a film or series is anime, which decides the library it goes to.
   *
   * @param kind - What is being asked for.
   * @param tmdbId - Its catalogue id, where it has one.
   * @returns Whether it is anime.
   */
  const isAnimeTitle = async (kind: MediaRequestKind, tmdbId: number | undefined) =>
    (kind === 'series' || kind === 'film') &&
    tmdbId !== undefined &&
    (await catalogueFor({ kind, tmdbId }))?.isAnime === true;

  /**
   * The quality profiles somebody may ask with, and the one they are given no say over, as whole
   * profiles, beside every profile that would fit the request whoever asked and the library it would
   * be filed into.
   *
   * Whoever manages requesting is neither gated nor forced. The locks and the default toggle narrow
   * what the house may ask for, and somebody who can edit the profiles is not the house — forcing
   * them would only mean editing a profile to make one request and editing it back.
   *
   * A book is offered nothing. A book is judged by its formats alone — EPUB before AZW3, M4B before
   * MP3 — never by a quality profile, so offering a quality would be asking a question that changes
   * nothing. The permission check above still runs, so refusing somebody who
   * may not ask still happens before anything else is worked out.
   *
   * @param who - Who is asking.
   * @param kind - What is being asked for.
   * @param libraryId - The library asked for, where one was.
   * @param allowed - The permissions that let somebody reach the profiles at all.
   * @param isAnime - Whether it is anime, which is filed among the anime.
   * @returns What to offer them, or why it could not be worked out.
   */
  const offerFor = async (
    who: Headers | Asker,
    kind: MediaRequestKind,
    libraryId: string | undefined,
    allowed: readonly Permission[] = [...ASKERS, ...APPROVERS],
    isAnime = false,
  ) => {
    const asker = asAsker(who);
    const account = await asker.account();
    const answer = await throughRequests(asker, (client) => client.listProfiles(), allowed);

    if (answer.kind !== 'answered') {
      return answer;
    }

    if (account === null) {
      return { kind: 'refused' as const, status: 403 as const, ...NOT_YOURS };
    }

    const into = await libraryForRequest(kind, libraryId, isAnime);

    if (isBookRequest(kind) || kind === 'bookSeries') {
      return {
        kind: 'answered' as const,
        value: { choices: [], forcedId: null, fitting: [], into, isManaging: false },
      };
    }

    const profileKind = isMusicRequest(kind) ? 'music' : 'video';
    const fitting = answer.value.filter(
      (profile) => profile.kind === profileKind && isForLibrary(profile, into?.id ?? null),
    );

    if (await asker.holds('requests.manage')) {
      return {
        kind: 'answered' as const,
        value: { choices: fitting, forcedId: null, fitting, into, isManaging: true },
      };
    }

    const held = await permissions.rolesFor(account.id);
    const offered = profilesOnOffer(
      answer.value,
      profileKind,
      { accountId: account.id, roleIds: held.map((role) => role.id) },
      into?.id ?? null,
    );

    return {
      kind: 'answered' as const,
      value: { ...offered, fitting, into, isManaging: false },
    };
  };

  /**
   * The quality profiles somebody may ask with, and the one they are given no say over, as the
   * profiles route says them: each by its id, its name and its kind.
   *
   * @param who - Who is asking.
   * @param kind - What is being asked for.
   * @param libraryId - The library asked for, where one was.
   * @param tmdbId - The film or series asked for, where known, so anime is offered the anime
   *   library's.
   * @returns What to offer them, or why it could not be worked out.
   */
  const profilesFor = async (
    who: Headers | Asker,
    kind: MediaRequestKind,
    libraryId?: string,
    tmdbId?: number,
  ) => {
    const offered = await offerFor(
      who,
      kind,
      libraryId,
      [...ASKERS, ...APPROVERS],
      await isAnimeTitle(kind, tmdbId),
    );

    if (offered.kind !== 'answered') {
      return offered;
    }

    return {
      kind: 'answered' as const,
      value: {
        choices: offered.value.choices.map((profile: QualityProfile) => ({
          id: profile.id,
          name: profile.name,
          kind: profile.kind,
        })),
        forcedId: offered.value.forcedId,
      },
    };
  };

  /**
   * Tells every open client that the requests have changed, so a poster, a request's page or the
   * list of requests says where each one has got to without being reopened. Nothing is said of what
   * changed beyond that it did, so it is safe for anybody to hear; each client reads back only what
   * it may see.
   */
  const sayRequestsChanged = (): void => {
    realtime?.publish('requests', { changed: true }, { kind: 'everyone' });
  };

  const describeForWebhooks = createWebhookRequestReader(discordIdOf);

  /**
   * Says a request's news to anything subscribed, where anything could be.
   *
   * @param payload - What happened.
   */
  const sayOfRequest = (payload: WebhookOccurrence): void => {
    sayRequestsChanged();
    void events?.publish(payload);
  };

  /**
   * The quality profile a request is to be judged by, once the locks and the default have had their
   * say: the one the server forces, the one the asker chose where it is theirs to choose, or, where
   * they chose none, one of theirs chosen for them.
   *
   * Choosing none is what a client does when there is only one quality to offer, so it is not a way
   * round the locks: left unnamed, the request would be judged by whichever profile fits the library
   * first, locked or not. So the library's own profile is used where it is theirs, then theirs that
   * is written for that library, then the one marked for when no quality is chosen, then their
   * first. Where profiles fit but none is theirs the ask is refused rather than handed to one of
   * somebody else's. Where no profile fits at all, none is named and requesting carries on as it
   * does on a server with no profiles. Whoever manages requesting is left to the library's own, as
   * they are never gated.
   *
   * Run before anything is drafted, because working out what a request would look like reveals what
   * libraries take requests, and somebody who may not ask should not learn that from being refused.
   * Reaching the profiles is itself gated on the same permission the ask is, so the refusal for not
   * being allowed to ask at all comes from here.
   *
   * @param who - Who is asking.
   * @param asked - What is being asked for.
   * @returns The profile to draft with, or why the ask is refused.
   */
  const profileForAsk = async (
    who: Headers | Asker,
    asked: MediaRequestAsk,
  ): Promise<
    | { kind: 'chosen'; profileId: string | undefined }
    | ({ kind: 'refused'; status: 400 | 403 | 404 | 502 } & RefusalBody)
  > => {
    const isMusic = isMusicRequest(asked.kind);
    const offered = await offerFor(
      who,
      asked.kind,
      asked.libraryId,
      [isMusic ? 'requests.askMusic' : 'requests.ask', ...APPROVERS],
      await isAnimeTitle(asked.kind, asked.tmdbId),
    );

    if (offered.kind !== 'answered') {
      return { ...offered, kind: 'refused' };
    }

    if (isBookRequest(asked.kind) || asked.kind === 'bookSeries') {
      return { kind: 'chosen', profileId: undefined };
    }

    const { choices, forcedId, fitting, into, isManaging } = offered.value;

    if (forcedId !== null) {
      return asked.profileId === undefined || asked.profileId === forcedId
        ? { kind: 'chosen', profileId: forcedId }
        : {
            kind: 'refused',
            status: 403,
            ...refuse('error.server.thisServerUsesOneQualityFor'),
          };
    }

    if (asked.profileId !== undefined && !choices.some(({ id }) => id === asked.profileId)) {
      return {
        kind: 'refused',
        status: 403,
        ...refuse('error.server.thatQualityIsNotAvailableTo'),
      };
    }

    if (asked.profileId !== undefined || isManaging || fitting.length === 0) {
      return { kind: 'chosen', profileId: asked.profileId };
    }

    const chosenForThem =
      choices.find((profile) => profile.id === into?.requestProfileId) ??
      choices.find((profile) => into !== undefined && profile.libraryIds.includes(into.id)) ??
      choices.find((profile) => profile.isFallback) ??
      choices[0];

    return chosenForThem === undefined
      ? { kind: 'refused', status: 403, ...refuse('error.server.noQualityHereIsAvailableTo') }
      : { kind: 'chosen', profileId: chosenForThem.id };
  };

  type Drafted =
    | { kind: 'drafted'; draft: MediaRequestDraft }
    | ({ kind: 'refused'; status: 400 } & RefusalBody);

  const catalogueFor = (asked: Parameters<typeof catalogueForRequest>[1]) =>
    catalogueForRequest(
      {
        describeForRequest,
        describeMusicForRequest,
        describeBookForRequest,
        describeBookSeriesForRequest,
      },
      asked,
    );

  /**
   * What the requests service is told of something asked for: the catalogue's facts, the library
   * it will be filed into — of films, series or music, as it is — who asked and whether that makes
   * it approved.
   *
   * @param who - Who is asking.
   * @param asked - What they asked for.
   * @returns The request to make, or why it cannot be.
   */
  /**
   * The release types a music request watches when nobody said, which whoever set the server up
   * chose.
   *
   * @returns The types.
   */
  const defaultReleaseTypes = async (): Promise<ReleaseType[]> =>
    (await settings.read()).requestReleaseTypes;

  /**
   * What a library already holds of a series a request is for, as the requests service is told it,
   * so it fetches none of it again and files the rest beside it.
   *
   * @param into - The library the request files into.
   * @param tmdbId - The series.
   * @returns What it holds.
   */
  const heldFor = async (
    into: Pick<Library, 'id' | 'keepsShowsTogether'>,
    tmdbId: number,
  ): Promise<HeldInLibrary> =>
    heldInLibraryOf(
      await discovery.lookup.seriesFiles(tmdbId.toString()),
      into.id,
      into.keepsShowsTogether,
    );

  /**
   * The film the library a request files into already holds, as the requests service is told it,
   * so it is not fetched again; nothing where that library does not hold it, even where another
   * does.
   *
   * @param into - The library the request files into.
   * @param tmdbId - The film.
   * @returns What is held of it.
   */
  const heldFilmIn = async (
    into: Pick<Library, 'id'>,
    tmdbId: number,
  ): Promise<HeldInLibrary | null> => {
    const mediaId = await discovery.lookup.filmIn(into.id, tmdbId.toString());

    return mediaId === null ? null : { mediaId, episodes: [], folder: null, seasonFolders: [] };
  };

  /**
   * Which narration of a book's audiobook a new request fetches without asking: the only one, or
   * the one whoever reads its series in the library reads; nothing where somebody should choose.
   *
   * @param narrations - The book's narrations.
   * @returns The narrations chosen, or null for a choice to be made.
   */
  const narrationsWantedOf = async (narrations: readonly Narration[]): Promise<string[] | null> => {
    const series = narrations.find((narration) => narration.series !== null)?.series ?? null;
    const chosen = narrationOfSeries(
      narrations,
      series === null ? [] : await discovery.lookup.seriesNarrators(series),
    );

    return chosen === null ? null : [chosen];
  };

  const draftFor = async (
    who: Headers | Asker,
    asked: MediaRequestAsk,
    profileId: string | undefined,
  ): Promise<Drafted> => {
    const asker = asAsker(who);
    const account = await asker.account();
    const described = await catalogueFor(asked);
    const libraryKind = libraryKindOf(asked.kind);
    const chosen = await libraryForRequest(
      asked.kind,
      asked.libraryId,
      described?.isAnime === true,
    );
    const catalogue =
      chosen?.kind === 'anime' && asked.kind === 'series' && (described?.anime ?? null) === null
        ? await catalogueFor({ ...asked, asAnime: true })
        : described;

    if (catalogue === null) {
      return {
        kind: 'refused',
        status: 400,
        ...refuse('error.common.theCatalogueDoesNotKnowThat'),
      };
    }

    if (chosen === undefined || account === null) {
      return {
        kind: 'refused',
        status: 400,
        ...refuse('error.server.noLibraryOfKind', {
          kind: LIBRARY_KIND_WORDS[libraryKind],
        }),
      };
    }

    return {
      kind: 'drafted',
      draft: {
        kind: asked.kind,
        tmdbId: asked.tmdbId ?? null,
        musicBrainzId: asked.musicBrainzId ?? null,
        openLibraryId: asked.openLibraryId ?? null,
        seasons: asked.seasons,
        followsNewSeasons: asked.followsNewSeasons,
        releaseTypes:
          asked.releaseTypes ?? (isMusicRequest(asked.kind) ? await defaultReleaseTypes() : null),
        ...(asked.bookFormats === undefined ? {} : { bookFormats: asked.bookFormats }),
        profileId: profileId ?? chosen.requestProfileId,
        isPickedByHand: asked.isPickedByHand,
        libraryId: chosen.id,
        libraryPath: chosen.requestPath ?? chosen.path,
        libraryLanguage: chosen.defaultAudioLanguage,
        requestedBy: {
          id: account.id,
          name: await householdNameFor(account),
          askingProfile: (await asker.askingProfile?.()) ?? null,
        },
        higherProfileAsks: chosen.higherProfileAsks,
        isApproved: asked.origin === 'monitored' || (await asker.holds('requests.autoApprove')),
        catalogue,
        handOff: arrKindOf(chosen.kind) === null ? null : (chosen.fulfilment ?? null),
        ...(asked.kind === 'book' && (catalogue.narrations ?? []).length > 0
          ? { narrationsWanted: await narrationsWantedOf(catalogue.narrations ?? []) }
          : {}),
        ...(asked.kind === 'bookSeries'
          ? {
              seriesAsin: asked.seriesAsin ?? null,
              companionsWanted: asked.companionsWanted ?? [],
              keepsOneNarrator: asked.keepsOneNarrator ?? false,
              seriesNarrators: [...(await discovery.lookup.seriesNarrators(catalogue.title))],
            }
          : {}),
        origin: asked.origin,
        held:
          asked.kind === 'series' && asked.tmdbId !== undefined
            ? await heldFor(chosen, asked.tmdbId)
            : asked.kind === 'film' && asked.tmdbId !== undefined
              ? await heldFilmIn(chosen, asked.tmdbId)
              : isMusicRequest(asked.kind)
                ? await heldAlbumsOf(discovery.lookup, catalogue.albums)
                : null,
      },
    };
  };

  /**
   * What somebody may ask for: films and series, music, both or neither.
   *
   * @param headers - Who is asking.
   * @returns Whether they may ask for each.
   */
  const whatMayBeAsked = async (headers: Headers) => {
    const [video, music] = await Promise.all([
      requires(headers, 'requests.ask'),
      requires(headers, 'requests.askMusic'),
    ]);

    return { video, music };
  };

  /**
   * Every request anybody has made, for saying what has been asked for already — or none where the
   * requests service cannot say.
   *
   * @returns The requests.
   */
  const everyRequest = async () => {
    const answer = await requestsClient?.listRequests();

    return answer?.kind === 'answered' ? answer.value : [];
  };

  /**
   * What the catalogues know by a name: films and series from the film catalogue, music from the
   * music one and books from Open Library, each in the one shape a search answers with.
   *
   * @param query - What was typed.
   * @param kind - What kind of thing is being looked for.
   * @returns What matched, not yet stood against the library or the requests.
   */
  const findInCatalogue = async (query: string, kind: MediaRequestKind): Promise<UnstoodTitle[]> =>
    isBookRequest(kind)
      ? (await discovery.searchBooks(query)).map(bookAsTitle)
      : isMusicRequest(kind)
        ? (await searchMusicCatalogue(query, kind)).map(titleOfMusicHit)
        : (await searchCatalogue(query, kind === 'film' ? 'movie' : 'tv')).map((match) => ({
            kind,
            id: match.externalId,
            title: match.title,
            subtitle: null,
            year: match.year,
            overview: match.overview,
            posterUrl: match.posterUrl,
          }));

  /**
   * Says that something was asked for, and that it was approved where asking was enough; nothing of
   * a title only followed, which nobody asked for. The asker's Discord account, where one is on
   * theirs, goes with it so a Discord webhook can mention them.
   *
   * @param request - What the requests service made of the ask.
   * @param isNew - Whether this ask made it, rather than finding it already asked for.
   * @param isApproved - Whether the asker's ask approves it.
   */
  const sayOfAsk = (request: MediaRequest, isNew: boolean, isApproved: boolean): void => {
    if (request.origin === 'monitored') {
      return;
    }

    void (async () => {
      const described = await describeForWebhooks(request);

      if (isNew) {
        sayOfRequest({
          event: 'requests.made',
          data: {
            title: request.title,
            kind: request.kind,
            requestedBy: request.requestedBy.name,
            ...askerFieldsOf(request.requestedBy),
            request: described,
          },
        });
      }

      if (isApproved && (isNew || request.approval === 'approved')) {
        sayOfRequest({
          event: 'requests.approved',
          data: { title: request.title, approvedBy: null, request: described },
        });
      }
    })();
  };

  const requestsForPlugins: PluginHost['requests'] = {
    searchCatalogue: async (query, kind) => {
      if (kind === 'track') {
        return [];
      }

      const stood = await standTitles(
        (await findInCatalogue(query, kind)).slice(0, 20),
        discovery.lookup,
        await everyRequest(),
      );

      return stood.map((title) => ({
        catalogueId: title.id,
        kind,
        title: title.title,
        year: title.year,
        artist: kind === 'album' ? title.subtitle : null,
        isInLibrary: title.standing.status === 'library',
        isRequested: title.standing.status === 'requested',
      }));
    },
    create: async (profileId, hit) => {
      const accountId = (await profiles?.accountOf(profileId)) ?? null;
      const named = ((await listUsers?.()) ?? []).find((one) => one.id === accountId);
      const read = MediaRequestAskSchema.safeParse(
        hit.kind === 'album'
          ? { kind: 'album', musicBrainzId: hit.catalogueId }
          : { kind: hit.kind, tmdbId: Number(hit.catalogueId) },
      );

      if (hit.kind === 'track' || named === undefined || !read.success) {
        return { status: 'refused' };
      }

      const asker = askerFor({ id: named.id, name: named.name }, profileId);
      const profile = await profileForAsk(asker, read.data);

      if (profile.kind === 'refused') {
        const why = whyRequestsCannotBeMadeNow(profile);

        if (why !== null) {
          throw why;
        }

        return { status: 'refused' };
      }

      const drafted = await draftFor(asker, read.data, profile.profileId);
      const answer = await throughRequests(
        asker,
        (client) =>
          drafted.kind === 'refused'
            ? Promise.resolve({
                kind: 'refused' as const,
                status: drafted.status,
                refusal: bodyOf(drafted),
              })
            : client.addRequest(drafted.draft),
        [isMusicRequest(read.data.kind) ? 'requests.askMusic' : 'requests.ask'],
      );

      if (answer.kind !== 'answered') {
        const why = whyRequestsCannotBeMadeNow(answer);

        if (why !== null) {
          throw why;
        }

        return { status: 'refused' };
      }

      sayOfAsk(
        answer.value.request,
        answer.value.isNew,
        drafted.kind === 'drafted' && drafted.draft.isApproved,
      );

      return { status: answer.value.isNew ? 'made' : 'already' };
    },
    missingAlbums: missingAlbumsForPlugins({
      accountOf: async (profileId) => (await profiles?.accountOf(profileId)) ?? null,
      matcher: missingAlbums,
      stand: async (titles) => standTitles(titles, discovery.lookup, await everyRequest()),
    }),
  };

  const phoneHandBacks = createPhoneHandBacks();

  const plugins = startPlugins?.(requestsForPlugins);

  return {
    auth,
    plugins,
    findInCatalogue,
    sayOfAsk,
    settings,
    SERVER_VERSION,
    SERVER_COMMIT:
      givenCommit === undefined || givenCommit === ''
        ? commitThisIsRunning()
        : givenCommit.slice(0, 7),
    trustedOrigins,
    callerOf,
    countUsers,
    promoteToAdmin,
    library,
    playback,
    maintenance,
    schedules,
    presence,
    subtitles,
    subtitleFonts,
    segments,
    progress,
    downloads,
    favourites,
    liveTv,
    hiding,
    ratings,
    shares,
    shareSessions,
    calendarFeeds,
    playbackSessions,
    profiles,
    households,
    faces,
    splashscreen,
    brandLogo,
    unlockSecret,
    buckets,
    books,
    streamBookFile,
    music,
    collections,
    videoDevices,
    bookDevices,
    reencodes,
    onReencodeQueued,
    preTranscoding,
    promoteProfile,
    listUsers,
    capabilities,
    hardware,
    testHardware,
    folderReach,
    artworkUsage,
    bookPageUsage,
    libraryBytes,
    measureStorage,
    monitor,
    stalledJobs,
    readImage,
    isTranscoderReachable,
    folderDisk,
    uploadDisk,
    uploadSessions,
    transcoderAddress,
    listRunningJobs,
    jobDefinitions,
    requests,
    requestsClient,
    cancelJob,
    controlQueue,
    searchCatalogue,
    describeForRequest,
    describeMusicForRequest,
    describeBookForRequest,
    searchMusicCatalogue,
    missingAlbums,
    discovery,
    permissions,
    history,
    statistics,
    audit,
    recordAudit,
    nameOfAccount,
    backups,
    readLibraryHealth,
    updates,
    apiKeys,
    webhooks,
    notifications,
    readPushPublicKey,
    queueWebhookDelivery,
    linking,
    linkSharing,
    peerClaims,
    peerRequests,
    linkPeople,
    linkPersonOf,
    linkCatalogue: linkingOptions?.catalogue ?? (() => Promise.resolve(null)),
    syncLinkedServer: linkingOptions?.syncServer ?? (() => Promise.resolve(null)),
    tellLinkedOfChange: linkingOptions?.tellChanged ?? (() => Promise.resolve()),
    serverPictures: linkingOptions?.pictures,
    isLinkedServerReachable: linkingOptions?.isReachable ?? (() => true),
    linkParties: linkingOptions?.parties ?? null,
    linkedServerTakesRequests: linkingOptions?.takesRequests ?? (() => false),
    linkedAsk: linkingOptions?.ask ?? (() => Promise.resolve(null)),
    linkSharingStore,
    banAccount,
    unbanAccount,
    removeAccount,
    isAccountBanned,
    readBanReason,
    editAccount,
    setupLinks,
    createAccountWithoutPassword,
    resetAccountPassword,
    listAccountSessions,
    endAccountSessions,
    endAccountSession,
    realtime,
    logs,
    log,
    jobHistory,
    resourceHistory,
    events,
    sayALinkWasWithdrawn,
    onNamesChanged,
    email,
    subtitleFinder,
    requestPasswordReset,
    SHARE_JOINER,
    tooBigToRead,
    GUEST_REMEMBERED_FOR_SECONDS,
    forwardedFileHeaders,
    neverKeep,
    SignInBodySchema,
    OVERVIEW_PATIENCE_MILLISECONDS,
    NOT_STOOD,
    LIBRARY_KIND_WORDS,
    within,
    describeAccountRefusal,
    describeRefusal,
    sayRoleChanged,
    requires,
    grantsOf,
    isOnTheDemo,
    demoAccounts,
    viewerOf,
    readActing,
    chosenProfiles,
    profileLimits,
    profileManagement,
    bookInReach,
    isOutOfReach,
    refuseWhatIsOutOfReach,
    sayWhyUnchanged,
    settleChange,
    libraryToUploadInto,
    sayRefused,
    sweepAbandonedUploads,
    sayWhyNotDeleted,
    readProfileId,
    announceProfiles,
    theOwner,
    readAccount,
    isTheSessionOfWhoeverIsAsking,
    isTheDeviceOfWhoeverIsAsking,
    readKeyHolder,
    readWebhookKeeper,
    refuseWebhookKeeper,
    readActor,
    outranks,
    refusalOver,
    wouldStrandTheServer,
    mayDecideAccess,
    requestsOverview,
    NOT_YOURS,
    DATE_LENGTH,
    recheckRequests,
    REQUESTING_OFF,
    reachRequests,
    throughRequests,
    askerOf,
    askerFor,
    permissionsOfProfile,
    householdNameFor,
    APPROVERS,
    ASKERS,
    SEES_EVERY_REQUEST,
    libraryForRequest,
    profilesFor,
    sayRequestsChanged,
    sayOfRequest,
    describeForWebhooks,
    profileForAsk,
    profileOfAccount,
    catalogueFor,
    defaultReleaseTypes,
    draftFor,
    heldFor,
    whatMayBeAsked,
    everyRequest,
    phoneHandBacks,
  };
};

export { createAppContext };
