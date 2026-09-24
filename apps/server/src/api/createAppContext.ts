import { z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import { readViewer } from '@ValenceServer/visibility/readViewer';
import { subjectOfRequest } from '@ValenceServer/visibility/subjectOfRequest';
import type { Subject } from '@ValenceServer/visibility/subjectOfRequest';
import type { MiddlewareHandler } from 'hono';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { createMemoryHiddenService } from '@ValenceServer/hiding/createMemoryHiddenService';
import { createPresenceService } from '@ValenceServer/presence/PresenceService';
import {
  askForDownloadRoute,
  askForSeriesRoute,
  offerSeriesRoute,
  pauseDownloadRoute,
  resumeDownloadRoute,
  forgetDownloadRoute,
  holdDownloadRoute,
  listDownloadsRoute,
  listHoldingsRoute,
  offerDownloadRoute,
  releaseDownloadRoute,
  readDownloadRoute,
} from '@ValenceServer/routes/DownloadRoute';
import type { LibraryEntryChange } from '@ValenceServer/files/LibraryEntryChange';
import { createUploadSessions } from '@ValenceServer/uploads/createUploadSessions';
import { createUploadDisk } from '@ValenceServer/uploads/createUploadDisk';
import type { UploadRefusal } from '@ValenceServer/uploads/UploadDisk';
import { createFolderDisk } from '@ValenceServer/folders/createFolderDisk';
import { bodyLimit } from 'hono/body-limit';
import { describePictureFault } from '@ValenceServer/profiles/describePictureFault';
import { FACE_LIMITS } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { PictureLimits } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import { createMemorySplashscreenStore } from '@ValenceServer/splashscreen/createMemorySplashscreenStore';
import { JOB_DEFINITIONS } from '@ValenceServer/jobs/jobDefinitions';
import type { RequestsAnswer, RequestsClient } from '@ValenceServer/requests/createRequestsClient';
import { createMemoryMaintenanceService } from '@ValenceServer/maintenance/createMemoryMaintenanceService';
import { createMemoryJobScheduleService } from '@ValenceServer/jobs/createMemoryJobScheduleService';
import { createPhoneHandBacks } from '@ValenceServer/phone/createPhoneHandBacks';
import { checkAccountAction } from '@ValenceServer/auth/checkAccountAction';
import type { AccountActionRefusal } from '@ValenceServer/auth/checkAccountAction';
import type { RoleChangeRefusal } from '@ValenceServer/auth/checkRoleChange';
import { ADMINISTRATOR } from '@ValenceContracts/schemas/Permission';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createBetterAuthApiKeyService } from '@ValenceServer/auth/createBetterAuthApiKeyService';
import { createMemoryWebhookStore } from '@ValenceServer/webhooks/createMemoryWebhookStore';
import { createMemoryNotificationStore } from '@ValenceServer/notifications/createMemoryNotificationStore';
import { narrowToKey } from '@ValenceServer/auth/narrowToKey';
import { readSessionOnce } from '@ValenceServer/auth/readSessionOnce';
import type { WebhookOccurrence } from '@ValenceServer/events/EventBus';
import type {
  MediaRequestAsk,
  MediaRequestDraft,
  MediaRequestKind,
  ReleaseType,
} from '@ValenceContracts/schemas/MediaRequest';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { isForLibrary, profilesOnOffer } from '@ValenceContracts/functions/profilesOnOffer';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import { libraryKindOf } from '@ValenceContracts/functions/libraryKindOf';
import { catalogueForRequest } from '@ValenceServer/requests/catalogueForRequest';
import { workOf } from '@ValenceServer/requests/workOf';
import type { RequestsOverview } from '@ValenceContracts/schemas/Requests';
import { NO_DISCOVERY } from '@ValenceServer/requests/catalogue/NO_DISCOVERY';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { CreateAppOptions } from '@ValenceServer/api/CreateAppOptions';

const SHARE_JOINER = 'valence_share_joiner';

/**
 * Builds the guard that turns away a picture too big to keep before it has been read rather than
 * after.
 *
 * The size is checked again where the picture is judged, which is what makes the rule true; this is
 * only so that somebody uploading a film by mistake does not have it held in memory in full first.
 *
 * @param limits - The limits the picture is held to, a face's unless it is something drawn larger.
 * @returns The middleware to put in front of a route that takes a picture.
 */
const tooBigToRead = (limits: PictureLimits = FACE_LIMITS) =>
  bodyLimit({
    maxSize: limits.mostBytes,
    onError: (context) =>
      context.json({ error: describePictureFault('tooLarge', limits).error }, 413),
  });

const GUEST_REMEMBERED_FOR_SECONDS = 30 * 86_400;

const PROFILE_HEADER = 'x-valence-profile';

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
const describeAccountRefusal = (refusal: AccountActionRefusal): string =>
  refusal === 'self'
    ? 'You cannot do that to your own account.'
    : 'That account is at or above your own rank.';

/**
 * What to tell somebody whose change to a role was refused.
 */
const describeRefusal = (refusal: RoleChangeRefusal): string =>
  refusal === 'outranked'
    ? 'That role is at or above your own.'
    : 'You cannot grant a permission you do not hold.';

/**
 * Builds the Valence HTTP application.
 */

/**
 * Everything the server's endpoints are answered with: the services and settings it was built
 * with, and the helpers every area shares — who is asking and what they may do, what is out of
 * their reach, how a refusal is worded — made once, before any endpoint is registered.
 *
 * @param options - What the server was built with.
 * @param app - The application the endpoints are registered on, for the helpers that answer
 *   through it.
 * @returns The context each area's endpoints read from.
 */
const createAppContext = (options: CreateAppOptions, app: OpenAPIHono) => {
  const {
    auth,
    settings,
    version: SERVER_VERSION = '0.0.0',
    trustedOrigins,
    countUsers,
    promoteToAdmin,
    library,
    playback,
    maintenance = createMemoryMaintenanceService(),
    schedules = createMemoryJobScheduleService(),
    presence = createPresenceService(),
    subtitles,
    segments,
    progress,
    downloads,
    favourites,
    hiding = createMemoryHiddenService(),
    ratings,
    shares,
    shareSessions,
    playbackSessions,
    profiles,
    households,
    splashscreen = createMemorySplashscreenStore(),
    books,
    streamBookFile,
    music,
    videoDevices,
    reencodes,
    onReencodeQueued,
    promoteProfile,
    listUsers,
    capabilities,
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
    searchMusicCatalogue = () => Promise.resolve([]),
    discovery = NO_DISCOVERY,
    permissions = createMemoryPermissionService(),
    history,
    apiKeys = createBetterAuthApiKeyService(auth),
    webhooks = createMemoryWebhookStore(),
    notifications = createMemoryNotificationStore(),
    readPushPublicKey = () => Promise.resolve(''),
    queueWebhookDelivery = () => Promise.resolve(),

    banAccount,
    unbanAccount,
    removeAccount,
    isAccountBanned,
    readBanReason,
    inviteAccount,
    editAccount,
    resetAccountPassword,
    listAccountSessions,
    endAccountSessions,
    endAccountSession,
    setAccountPhoto,
    setAccountAvatar,
    realtime,
    logs,
    jobHistory,
    resourceHistory,
    events,
    sayALinkWasWithdrawn,
  } = options;

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
      data: { accountId: userId, name: named?.name ?? 'Somebody', role, change },
    });
  };

  /**
   * Whether whoever is asking holds a particular permission.
   */
  const requires = async (headers: Headers, permission: Permission): Promise<boolean> => {
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return false;
    }

    const held = await permissions.resolve(session.user.id);

    if (headers.get('x-api-key') === null) {
      return held.has(permission);
    }

    const allowed = await apiKeys.restrictionFor(headers, session.session.id);

    return narrowToKey(held, allowed).has(permission);
  };

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
  const viewerOf = (headers: Headers): Promise<Viewer | null> =>
    readViewer({ auth, permissions, ...(profiles === undefined ? {} : { profiles }) }, headers);

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
   * @param accountId - Whose account is asking.
   * @param subject - The item or programme in question.
   * @returns Whether to refuse it.
   */
  const isOutOfReach = async (accountId: string, subject: Subject): Promise<boolean> => {
    if (subject.kind === 'none') {
      return false;
    }

    const refused =
      subject.kind === 'item'
        ? await library.isOutOfReach(accountId, subject.mediaId)
        : await library.isSeriesOutOfReach(accountId, subject.seriesId);

    if (!refused) {
      return false;
    }

    return !(await permissions.resolve(accountId)).has(ADMINISTRATOR);
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

    const session = await readSessionOnce(auth, context.req.raw.headers);

    if (session === null) {
      return next();
    }

    if (await isOutOfReach(session.user.id, subject)) {
      return context.json({ error: 'No such item.' }, 404);
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
        return { error: 'That is not inside a library.', status: 403 } as const;
      case 'root':
        return {
          error: 'That is a library’s own folder. Change the library itself instead.',
          status: 400,
        } as const;
      case 'exists':
        return { error: 'Something of that name is already there.', status: 409 } as const;
      case 'badName':
        return {
          error: 'A name is one plain name, with no slashes and no space at either end.',
          status: 400,
        } as const;
      case 'intoItself':
        return { error: 'A folder cannot be moved into itself.', status: 400 } as const;
      case 'otherDisk':
        return {
          error:
            'That would move it onto another disk, which Valence does not do. Copy it across on the machine instead.',
          status: 400,
        } as const;
      case 'missing':
        return { error: 'There is nothing there.', status: 404 } as const;
      case 'readOnly':
        return {
          error:
            'That disk is read-only to Valence. Give it read-write access to change files there.',
          status: 403,
        } as const;
      case 'denied':
        return { error: 'Valence is not allowed to change files there.', status: 403 } as const;
      case 'failed':
        return { error: 'That could not be done.', status: 500 } as const;
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
  ): Promise<{ path: string } | { error: string; status: 400 | 403 | 404 | 409 | 500 }> => {
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
          error:
            'That disk is read-only to Valence. Give it read-write access to upload media there.',
          status: 403,
        } as const)
      : refusal.kind === 'denied'
        ? ({ error: 'Valence is not allowed to write there.', status: 403 } as const)
        : ({ error: 'The file could not be written.', status: 500 } as const);

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
          error: 'That file is not inside its library, so Valence will not delete it.',
          status: 403,
        } as const;
      case 'readOnly':
        return {
          error:
            'That disk is read-only to Valence. Give it read-write access to delete media there.',
          status: 403,
        } as const;
      case 'denied':
        return { error: 'Valence is not allowed to delete files there.', status: 403 } as const;
      case 'failed':
        return { error: 'The file could not be deleted.', status: 500 } as const;
    }
  };

  /**
   * Which person on this account is watching.
   */
  const readProfileId = async (headers: Headers): Promise<string | null> => {
    const session = await readSessionOnce(auth, headers);
    const viewer = session?.user;

    if (viewer === undefined || profiles === undefined) {
      return null;
    }

    const named = headers.get(PROFILE_HEADER);

    if (named !== null && (await profiles.belongsTo(viewer.id, named))) {
      return named;
    }

    return (await profiles.ensureDefault(viewer.id, viewer.name)).id;
  };

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
    realtime?.publish(
      'profile',
      { changed: true },
      (await settings.read()).showsProfilesBeforeSignIn
        ? { kind: 'everyone' }
        : { kind: 'accounts', accountIds: [accountId] },
    );
  };

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
   * Whoever is asking, if they may hold keys at all.
   */
  const readKeyHolder = async (headers: Headers) => {
    const account = await readAccount(headers);

    if (account === null) {
      return { account: null, refusal: 'anonymous' } as const;
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
      ? ({ error: 'Nobody is signed in.', status: 401 } as const)
      : ({ error: 'This account may not manage webhooks.', status: 403 } as const);

  /**
   * Who is asking, and what they may do — resolved once for the role routes, which need both their
   * permissions and their rank.
   */
  const readActor = async (headers: Headers) => {
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return null;
    }

    const held = await permissions.rolesFor(session.user.id);

    return {
      id: session.user.id,
      permissions: await permissions.resolve(session.user.id),
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
  const mayDecideAccess = async (headers: Headers, userId: string): Promise<string | null> => {
    const actor = await readActor(headers);

    if (actor === null || !actor.permissions.has('account.manage')) {
      return 'That is for administrators.';
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

  const NOT_YOURS = { error: 'That is for whoever sets up requesting.' };

  const DATE_LENGTH = 10;

  /**
   * Asks the requests service again how it is, after an indexer changed, so that a warning about
   * one that was removed, turned back on or mended goes at once rather than at the next check.
   */
  const recheckRequests = async (): Promise<void> => {
    await requests?.check();
  };

  const REQUESTING_OFF = { error: 'Requesting is off.' };

  /**
   * Whether somebody may reach through to the requests service, and the client to do it with.
   *
   * @param headers - Who is asking.
   * @returns The client, or why not.
   */
  const reachRequests = async (
    headers: Headers,
    allowed: readonly Permission[] = ['requests.manage'],
  ): Promise<RequestsClient | 'refused' | 'off'> => {
    for (const permission of allowed) {
      if (await requires(headers, permission)) {
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
   * @param headers - Who is asking.
   * @param ask - What to ask the service.
   * @param allowed - The permissions, any one of which lets them ask.
   * @returns The answer, or why not.
   */
  const throughRequests = async <Value>(
    headers: Headers,
    ask: (client: RequestsClient) => Promise<RequestsAnswer<Value>>,
    allowed: readonly Permission[] = ['requests.manage'],
  ): Promise<
    | { kind: 'answered'; value: Value }
    | { kind: 'refused'; status: 400 | 403 | 404 | 502; error: string }
  > => {
    const client = await reachRequests(headers, allowed);

    if (client === 'refused') {
      return { kind: 'refused', status: 403, ...NOT_YOURS };
    }

    if (client === 'off') {
      return { kind: 'refused', status: 404, ...REQUESTING_OFF };
    }

    const answer = await ask(client);

    if (answer.kind === 'silent') {
      return { kind: 'refused', status: 502, error: answer.reason };
    }

    return answer.kind === 'refused'
      ? { kind: 'refused', status: answer.status, error: answer.error }
      : answer;
  };

  const APPROVERS: readonly Permission[] = ['requests.approve', 'requests.manage'];

  const ASKERS: readonly Permission[] = ['requests.ask', 'requests.askMusic'];

  const SEES_EVERY_REQUEST: readonly Permission[] = [
    'requests.viewAll',
    'requests.approve',
    'requests.manage',
  ];

  /**
   * The quality profiles somebody may ask with, and the one they are given no say over.
   *
   * Whoever manages requesting is neither gated nor forced. The locks and the default toggle narrow
   * what the house may ask for, and somebody who can edit the profiles is not the house — forcing
   * them would only mean editing a profile to make one request and editing it back.
   *
   * A book is offered nothing. Books are never searched for by themselves — they are marked as
   * added by hand — so no profile ever judges one, and offering a quality would be asking a
   * question that changes nothing. The permission check above still runs, so refusing somebody who
   * may not ask still happens before anything else is worked out.
   *
   * @param headers - What the asking carried.
   * @param kind - Whether the request is for music or for video.
   * @returns What to offer them, or why it could not be worked out.
   */
  const libraryForRequest = async (kind: MediaRequestKind, libraryId?: string) => {
    const wanted = libraryKindOf(kind);
    const libraries = (await library.list(asTheServer)).filter(
      (entry) => entry.kind === wanted && entry.takesRequests,
    );

    return libraryId === undefined
      ? libraries[0]
      : libraries.find((entry) => entry.id === libraryId);
  };

  const profilesFor = async (
    headers: Headers,
    kind: MediaRequestKind,
    libraryId: string | undefined,
    allowed: readonly Permission[] = [...ASKERS, ...APPROVERS],
  ) => {
    const session = await readSessionOnce(auth, headers);
    const answer = await throughRequests(headers, (client) => client.listProfiles(), allowed);

    if (answer.kind !== 'answered') {
      return answer;
    }

    if (session === null) {
      return { kind: 'refused' as const, status: 403 as const, ...NOT_YOURS };
    }

    if (isBookRequest(kind)) {
      return { kind: 'answered' as const, value: { choices: [], forcedId: null } };
    }

    const asChoice = (profile: QualityProfile) => ({
      id: profile.id,
      name: profile.name,
      kind: profile.kind,
    });
    const profileKind = isMusicRequest(kind) ? 'music' : 'video';
    const into = (await libraryForRequest(kind, libraryId))?.id ?? null;

    if (await requires(headers, 'requests.manage')) {
      return {
        kind: 'answered' as const,
        value: {
          choices: answer.value
            .filter((profile) => profile.kind === profileKind && isForLibrary(profile, into))
            .map(asChoice),
          forcedId: null,
        },
      };
    }

    const held = await permissions.rolesFor(session.user.id);
    const offered = profilesOnOffer(
      answer.value,
      profileKind,
      { accountId: session.user.id, roleIds: held.map((role) => role.id) },
      into,
    );

    return {
      kind: 'answered' as const,
      value: { choices: offered.choices.map(asChoice), forcedId: offered.forcedId },
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
   * say: the one the server forces, the one the asker chose where it is theirs to choose, or none,
   * which leaves the library's own.
   *
   * Run before anything is drafted, because working out what a request would look like reveals what
   * libraries take requests, and somebody who may not ask should not learn that from being refused.
   * Reaching the profiles is itself gated on the same permission the ask is, so the refusal for not
   * being allowed to ask at all comes from here.
   *
   * @param headers - What the asking carried.
   * @param asked - What is being asked for.
   * @returns The profile to draft with, or why the ask is refused.
   */
  const profileForAsk = async (
    headers: Headers,
    asked: MediaRequestAsk,
  ): Promise<
    | { kind: 'chosen'; profileId: string | undefined }
    | { kind: 'refused'; status: 400 | 403 | 404 | 502; error: string }
  > => {
    const isMusic = isMusicRequest(asked.kind);
    const offered = await profilesFor(headers, asked.kind, asked.libraryId, [
      isMusic ? 'requests.askMusic' : 'requests.ask',
      ...APPROVERS,
    ]);

    if (offered.kind !== 'answered') {
      return { kind: 'refused', status: offered.status, error: offered.error };
    }

    if (isBookRequest(asked.kind)) {
      return { kind: 'chosen', profileId: undefined };
    }

    const { choices, forcedId } = offered.value;

    if (forcedId !== null) {
      return asked.profileId === undefined || asked.profileId === forcedId
        ? { kind: 'chosen', profileId: forcedId }
        : {
            kind: 'refused',
            status: 403,
            error: 'This server uses one quality for every request.',
          };
    }

    if (asked.profileId !== undefined && !choices.some(({ id }) => id === asked.profileId)) {
      return { kind: 'refused', status: 403, error: 'That quality is not available to you.' };
    }

    return { kind: 'chosen', profileId: asked.profileId };
  };

  type Drafted =
    { kind: 'drafted'; draft: MediaRequestDraft } | { kind: 'refused'; status: 400; error: string };

  const catalogueFor = (asked: Parameters<typeof catalogueForRequest>[1]) =>
    catalogueForRequest(
      { describeForRequest, describeMusicForRequest, describeBookForRequest },
      asked,
    );

  /**
   * What the requests service is told of something asked for: the catalogue's facts, the library
   * it will be filed into — of films, series or music, as it is — who asked and whether that makes
   * it approved.
   *
   * @param headers - Who is asking.
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

  const draftFor = async (
    headers: Headers,
    asked: MediaRequestAsk,
    profileId: string | undefined,
  ): Promise<Drafted> => {
    const session = await readSessionOnce(auth, headers);
    const catalogue = await catalogueFor(asked);
    const libraryKind = libraryKindOf(asked.kind);
    const libraries = (await library.list(asTheServer)).filter(
      (entry) => entry.kind === libraryKind && entry.takesRequests,
    );
    const chosen =
      asked.libraryId === undefined
        ? libraries[0]
        : libraries.find((entry) => entry.id === asked.libraryId);

    if (catalogue === null) {
      return {
        kind: 'refused',
        status: 400,
        error: 'The catalogue does not know that, or cannot be asked just now.',
      };
    }

    if (chosen === undefined || session === null) {
      return {
        kind: 'refused',
        status: 400,
        error: `There is no library of ${LIBRARY_KIND_WORDS[libraryKind]} to put it in.`,
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
        releaseTypes:
          asked.releaseTypes ?? (isMusicRequest(asked.kind) ? await defaultReleaseTypes() : null),
        profileId: profileId ?? chosen.requestProfileId,
        isPickedByHand: asked.isPickedByHand,
        libraryId: chosen.id,
        libraryPath: chosen.requestPath ?? chosen.path,
        libraryLanguage: chosen.defaultAudioLanguage,
        requestedBy: { id: session.user.id, name: session.user.name },
        isApproved: await requires(headers, 'requests.autoApprove'),
        catalogue,
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

  if (downloads !== undefined) {
    app.openapi(offerDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      const offer = await downloads.offer(
        context.req.valid('param').mediaId,
        context.req.valid('json').deviceProfile,
      );

      return offer === null
        ? context.json({ error: 'No such media item.' }, 404)
        : context.json(offer, 200);
    });

    app.openapi(askForDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      const { quality, audioLanguages } = context.req.valid('json');

      const asked = await downloads.ask(
        profileId,
        context.req.valid('param').mediaId,
        quality,
        audioLanguages ?? [],
      );

      return asked === null
        ? context.json({ error: 'No such media item.' }, 404)
        : context.json(asked, 200);
    });

    app.openapi(offerSeriesRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      const { deviceProfile, mediaIds } = context.req.valid('json');
      const offer = await downloads.offerSeries(
        context.req.valid('param').seriesId,
        deviceProfile,
        mediaIds,
      );

      return offer === null
        ? context.json({ error: 'No such programme.' }, 404)
        : context.json(offer, 200);
    });

    app.openapi(askForSeriesRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      const { quality, audioLanguages, mediaIds } = context.req.valid('json');

      const queued = await downloads.askForSeries(
        profileId,
        context.req.valid('param').seriesId,
        quality,
        audioLanguages ?? [],
        mediaIds,
      );

      return context.json({ downloads: queued }, 200);
    });

    app.openapi(pauseDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      await downloads.pause(profileId, context.req.valid('param').id);

      return context.body(null, 204);
    });

    app.openapi(resumeDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      await downloads.resume(profileId, context.req.valid('param').id);

      return context.body(null, 204);
    });

    app.openapi(listDownloadsRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      return context.json({ downloads: await downloads.refresh(profileId) }, 200);
    });

    app.openapi(forgetDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      await downloads.forget(profileId, context.req.valid('param').id);

      return context.body(null, 204);
    });

    app.openapi(readDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      const file = await downloads.readFile(
        profileId,
        context.req.valid('param').id,
        context.req.header('range') ?? null,
      );

      if (file === null) {
        return context.json({ error: 'Nothing prepared under that name.' }, 404);
      }

      return context.body(file.body, file.status === 206 ? 206 : 200, forwardedFileHeaders(file));
    });

    app.openapi(listHoldingsRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      return context.json({ holdings: await downloads.held(profileId) }, 200);
    });

    app.openapi(holdDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      const clientId = context.req.header('x-valence-client') ?? profileId;

      await downloads.hold(
        profileId,
        clientId,
        context.req.valid('param').mediaId,
        context.req.valid('json').quality,
      );

      return context.body(null, 204);
    });

    app.openapi(releaseDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      const { mediaId, quality } = context.req.valid('param');
      const clientId = context.req.header('x-valence-client') ?? profileId;

      await downloads.release(profileId, clientId, mediaId, quality);

      return context.body(null, 204);
    });
  }

  const phoneHandBacks = createPhoneHandBacks();

  return {
    auth,
    settings,
    SERVER_VERSION,
    trustedOrigins,
    countUsers,
    promoteToAdmin,
    library,
    playback,
    maintenance,
    schedules,
    presence,
    subtitles,
    segments,
    progress,
    downloads,
    favourites,
    hiding,
    ratings,
    shares,
    shareSessions,
    playbackSessions,
    profiles,
    households,
    splashscreen,
    books,
    streamBookFile,
    music,
    videoDevices,
    reencodes,
    onReencodeQueued,
    promoteProfile,
    listUsers,
    capabilities,
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
    discovery,
    permissions,
    history,
    apiKeys,
    webhooks,
    notifications,
    readPushPublicKey,
    queueWebhookDelivery,
    banAccount,
    unbanAccount,
    removeAccount,
    isAccountBanned,
    readBanReason,
    inviteAccount,
    editAccount,
    resetAccountPassword,
    listAccountSessions,
    endAccountSessions,
    endAccountSession,
    setAccountPhoto,
    setAccountAvatar,
    realtime,
    logs,
    jobHistory,
    resourceHistory,
    events,
    sayALinkWasWithdrawn,
    SHARE_JOINER,
    tooBigToRead,
    GUEST_REMEMBERED_FOR_SECONDS,
    PROFILE_HEADER,
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
    viewerOf,
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
    wouldStrandTheServer,
    mayDecideAccess,
    requestsOverview,
    NOT_YOURS,
    DATE_LENGTH,
    recheckRequests,
    REQUESTING_OFF,
    reachRequests,
    throughRequests,
    APPROVERS,
    ASKERS,
    SEES_EVERY_REQUEST,
    libraryForRequest,
    profilesFor,
    sayRequestsChanged,
    sayOfRequest,
    profileForAsk,
    catalogueFor,
    defaultReleaseTypes,
    draftFor,
    whatMayBeAsked,
    everyRequest,
    phoneHandBacks,
  };
};

export { createAppContext };
