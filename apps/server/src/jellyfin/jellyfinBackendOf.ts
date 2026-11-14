import { z } from 'zod';
import { refuse } from '@ValenceI18n/refuse';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { syntheticJellyfinId } from '@ValenceServer/jellyfin/syntheticJellyfinId';
import { valenceHeadersOf } from '@ValenceServer/jellyfin/valenceHeadersOf';
import { JELLYFIN_TOKEN_KINDS } from '@ValenceServer/jellyfin/JELLYFIN_TOKEN_KINDS';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type {
  JellyfinBackend,
  JellyfinCaller,
  JellyfinOrigin,
  JellyfinPlayback,
  JellyfinRefused,
  JellyfinSignedIn,
} from '@ValenceServer/jellyfin/JellyfinBackend';

const SignedInSchema = z.object({ token: z.string().min(1) });

const SessionUserSchema = z.object({
  email: z.string(),
  username: z.string().nullish(),
});

const StartedSchema = z.object({
  sessionId: z.string().min(1),
  delivery: z.union([
    z.object({ kind: z.literal('hls'), manifestUrl: z.string() }),
    z.object({ kind: z.literal('direct'), url: z.string() }),
  ]),
});

const CastSchema = z.object({ manifestUrl: z.string().min(1) });

const RefusedWithSchema = RefusalSchema.extend({ needs: z.string().optional() });

const TICKET_IN_ADDRESS = /\/api\/playback\/cast\/([^/]+)\//u;

const EMAIL = /@/u;

/**
 * A refusal Valence answered with, passed on in its own words, with the status a Jellyfin app
 * understands.
 *
 * @param response - Valence's refusal.
 * @returns The refusal.
 */
const refusedBy = async (response: Response): Promise<JellyfinRefused> => {
  const read = RefusalSchema.safeParse(await response.json().catch(() => null));
  const known = [401, 403, 404, 422, 429] as const;
  const status = known.find((one) => one === response.status) ?? 500;

  return {
    kind: 'refused',
    status,
    refusal: read.success ? read.data : refuse('error.common.thatCouldNotBeDone'),
  };
};

/**
 * What Jellyfin apps are answered with, from Valence's own services and its own endpoints. What a
 * viewer may see is read through the services with the viewer the request's session makes, so
 * library access, age limits and locks hold as they do for Valence's apps; what changes anything —
 * signing in, choosing a profile, starting playback, recording progress — goes through Valence's
 * own endpoints, so their limits, statistics and records hold too, and nothing is done twice.
 *
 * @param context - What the server's endpoints are answered with.
 * @returns What the Jellyfin endpoints are answered with.
 */
const jellyfinBackendOf = (context: AppContext): JellyfinBackend => {
  const {
    auth,
    settings,
    library,
    progress,
    favourites,
    profiles,
    readActing,
    viewerOf,
    readImage,
    artworkNames,
  } = context;

  const ask = (
    origin: JellyfinOrigin,
    headers: Headers,
    method: string,
    path: string,
    body?: object,
  ): Promise<Response> => {
    const sent = new Headers(headers);

    if (body !== undefined) {
      sent.set('content-type', 'application/json');
    }

    return origin.send(
      new Request(new URL(path, origin.url), {
        method,
        headers: sent,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    );
  };

  const callerOf = async (
    token: string,
    origin: JellyfinOrigin,
  ): Promise<JellyfinCaller | null> => {
    const headers = valenceHeadersOf(token, origin);
    const acting = await readActing(headers);

    if (acting === null || acting.profile === null) {
      return null;
    }

    const viewer = await viewerOf(headers);

    if (viewer === null) {
      return null;
    }

    return {
      token,
      origin,
      headers,
      viewer,
      accountId: acting.account.id,
      profile: {
        id: acting.profile.id,
        name: acting.profile.name,
        isOwner: acting.profile.isOwner,
      },
      isAdministrator: viewer.kind === 'account' && viewer.isAdministrator,
    };
  };

  const wrongPassword = (): JellyfinRefused => ({
    kind: 'refused',
    status: 401,
    refusal: refuse('server.jellyfin.thatNameOrPasswordIsWrong'),
  });

  const asKey = async (
    identifier: string,
    profileName: string | null,
    password: string,
    origin: JellyfinOrigin,
  ): Promise<JellyfinSignedIn | null> => {
    const token = `${JELLYFIN_TOKEN_KINDS.key}${password}`;
    const session = await auth.api
      .getSession({ headers: valenceHeadersOf(token, origin) })
      .catch(() => null);
    const user = SessionUserSchema.safeParse(session?.user);
    const named = identifier.toLowerCase();

    if (
      !user.success ||
      (user.data.email.toLowerCase() !== named && user.data.username?.toLowerCase() !== named)
    ) {
      return null;
    }

    const caller = await callerOf(token, origin);

    if (caller === null) {
      return null;
    }

    if (profileName !== null && caller.profile.name.toLowerCase() !== profileName.toLowerCase()) {
      return {
        kind: 'refused',
        status: 403,
        refusal: refuse('server.jellyfin.thatKeyIsForAnotherProfile', {
          name: caller.profile.name,
        }),
      };
    }

    return { kind: 'signedIn', caller };
  };

  const signOutOf = async (origin: JellyfinOrigin, headers: Headers): Promise<void> => {
    await ask(origin, headers, 'POST', '/api/auth/sign-out', {}).catch(() => null);
  };

  const signIn: JellyfinBackend['signIn'] = async (
    { identifier, profileName, password },
    origin,
  ) => {
    const byKey = await asKey(identifier, profileName, password, origin);

    if (byKey !== null) {
      return byKey;
    }

    const isEmail = EMAIL.test(identifier);
    const answer = await ask(
      origin,
      valenceHeadersOf(null, origin),
      'POST',
      isEmail ? '/api/auth/sign-in/email' : '/api/auth/sign-in/username',
      isEmail ? { email: identifier, password } : { username: identifier, password },
    );

    if (answer.status === 429) {
      return refusedBy(answer);
    }

    const signedIn = answer.ok
      ? SignedInSchema.safeParse(await answer.json().catch(() => null))
      : null;

    if (signedIn === null || !signedIn.success) {
      return wrongPassword();
    }

    const token = `${JELLYFIN_TOKEN_KINDS.session}${signedIn.data.token}`;
    const headers = valenceHeadersOf(token, origin);
    const acting = await readActing(headers);

    if (acting === null) {
      return wrongPassword();
    }

    const everyone = profiles === undefined ? [] : await profiles.list(acting.account.id);
    const wanted =
      profileName === null
        ? (everyone.find((one) => one.isOwner) ?? everyone[0])
        : everyone.find((one) => one.name.toLowerCase() === profileName.toLowerCase());

    if (wanted === undefined && profileName !== null) {
      await signOutOf(origin, headers);

      return {
        kind: 'refused',
        status: 404,
        refusal: refuse('server.jellyfin.noProfileByThatName', { name: profileName }),
      };
    }

    if (wanted?.hasPin === true) {
      await signOutOf(origin, headers);

      return {
        kind: 'refused',
        status: 403,
        refusal: refuse('server.jellyfin.thatProfileHasAPin', { name: wanted.name }),
      };
    }

    if (wanted !== undefined) {
      const chosen = await ask(origin, headers, 'POST', `/api/profiles/${wanted.id}/choose`, {});

      if (!chosen.ok) {
        await signOutOf(origin, headers);

        const refused = RefusedWithSchema.safeParse(await chosen.json().catch(() => null));

        return {
          kind: 'refused',
          status: 403,
          refusal: refused.success
            ? refused.data
            : refuse('server.jellyfin.thatProfileHasAPin', { name: wanted.name }),
        };
      }
    }

    const caller = await callerOf(token, origin);

    return caller === null ? wrongPassword() : { kind: 'signedIn', caller };
  };

  const startPlayback: JellyfinBackend['startPlayback'] = async (caller, mediaId, asked) => {
    const answer = await ask(
      caller.origin,
      caller.headers,
      'POST',
      `/api/playback/${mediaId}/session`,
      {
        deviceProfile: asked.deviceProfile,
        clientId: `jellyfin-${caller.origin.client.deviceId ?? caller.profile.id}`,
        startSeconds: Math.floor(asked.startSeconds),
        picksItsOwnSound: true,
        ...(asked.audioStreamIndex === undefined
          ? {}
          : { audioStreamIndex: asked.audioStreamIndex }),
        ...(asked.subtitleStreamIndex === undefined
          ? {}
          : { subtitleStreamIndex: asked.subtitleStreamIndex }),
      },
    );

    if (!answer.ok) {
      return refusedBy(answer);
    }

    const started = StartedSchema.safeParse(await answer.json().catch(() => null));

    if (!started.success) {
      return { kind: 'refused', status: 500, refusal: refuse('error.common.thatCouldNotBeDone') };
    }

    const { sessionId, delivery } = started.data;

    if (delivery.kind === 'direct') {
      return { kind: 'direct', sessionId };
    }

    const cast = await ask(
      caller.origin,
      caller.headers,
      'POST',
      `/api/playback/session/${encodeURIComponent(sessionId)}/cast`,
    );
    const address = cast.ok ? CastSchema.safeParse(await cast.json().catch(() => null)) : null;
    const ticket =
      address?.success === true ? TICKET_IN_ADDRESS.exec(address.data.manifestUrl)?.[1] : undefined;

    if (ticket === undefined) {
      return { kind: 'refused', status: 500, refusal: refuse('error.common.thatCouldNotBeDone') };
    }

    const playback: JellyfinPlayback = { kind: 'hls', sessionId, ticket };

    return playback;
  };

  return {
    serverId: async () =>
      syntheticJellyfinId('server', (await settings.read()).ownerAccountId || 'valence'),
    serverName: async () => {
      const { brand } = await settings.read();

      // oxlint-disable-next-line valence/no-hard-coded-strings -- the product's name, which a Jellyfin app shows as the server's name where no brand is set
      return brand.name ?? 'Valence';
    },
    signIn,
    signOut: async (caller) => {
      if (caller.token.startsWith(JELLYFIN_TOKEN_KINDS.session)) {
        await signOutOf(caller.origin, caller.headers);
      }
    },
    callerOf,
    libraries: (caller) => library.list(caller.viewer),
    listItems: (caller, libraryIds, options) =>
      library.listItemsAcross(caller.viewer, libraryIds, {
        ...options,
        profileId: caller.profile.id,
      }),
    listShows: async (caller, libraryId) =>
      (await library.listShows(caller.viewer, libraryId)) ?? [],
    getShow: (caller, libraryId, showId) => library.getShow(caller.viewer, libraryId, showId),
    getMedia: async (caller, mediaId) =>
      (await library.isOutOfReach(caller.viewer, mediaId)) ? null : library.getMedia(mediaId),
    upNext: async (caller) => (await library.upNext(caller.viewer)).map((next) => next.episode),
    progress: (caller) => progress.list(caller.profile.id),
    favourites: async (caller) =>
      (await favourites.list(caller.profile.id)).map((favourite) => favourite.mediaId),
    recordProgress: async (caller, mediaId, report) =>
      (await ask(caller.origin, caller.headers, 'PUT', `/api/media/${mediaId}/progress`, report))
        .ok,
    forgetProgress: async (caller, mediaId) =>
      (await ask(caller.origin, caller.headers, 'DELETE', `/api/media/${mediaId}/progress`)).ok,
    setFavourite: async (caller, mediaId, isFavourite) =>
      (
        await ask(
          caller.origin,
          caller.headers,
          isFavourite ? 'PUT' : 'DELETE',
          `/api/media/${mediaId}/favourite`,
        )
      ).ok,
    startPlayback,
    stopPlayback: async (caller, sessionId) => {
      await ask(
        caller.origin,
        caller.headers,
        'DELETE',
        `/api/playback/session/${encodeURIComponent(sessionId)}`,
      ).catch(() => null);
    },
    readSessionFile: (origin, ticket, name) =>
      ask(
        origin,
        valenceHeadersOf(null, origin),
        'GET',
        `/api/playback/cast/${encodeURIComponent(ticket)}/${encodeURIComponent(name)}`,
      ),
    readDirectFile: (caller, mediaId) => {
      const headers = new Headers(caller.headers);
      const range = caller.origin.headers.get('range');

      if (range !== null) {
        headers.set('range', range);
      }

      return ask(caller.origin, headers, 'GET', `/api/playback/${mediaId}/file`);
    },
    readArtwork: async (name, width) => {
      const url = artworkNames === undefined ? null : await artworkNames.urlOf(name);

      if (url === null || readImage === undefined) {
        return null;
      }

      return readImage(url, ...(width === null ? [] : [width]));
    },
    readAvatar: async (profileId) => (await profiles?.readAvatar(profileId)) ?? null,
  };
};

export { jellyfinBackendOf };
