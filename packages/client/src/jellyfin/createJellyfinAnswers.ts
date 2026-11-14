/* oxlint-disable valence/no-hard-coded-strings -- Jellyfin's own query values and item kinds, which its server matches on and no person reads */
import { z } from 'zod';
import { saying } from '@ValenceI18n/saying';
import { DeviceProfileSchema } from '@ValenceContracts/schemas/DeviceProfile';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { isJellyfinVideoView } from '@ValenceClient/jellyfin/isJellyfinVideoView';
import { jellyfinProfileOfDevice } from '@ValenceClient/jellyfin/jellyfinProfileOfDevice';
import { libraryOfJellyfinView } from '@ValenceClient/jellyfin/libraryOfJellyfinView';
import { mediaDetailOfJellyfinItem } from '@ValenceClient/jellyfin/mediaDetailOfJellyfinItem';
import { mediaSummaryOfJellyfinItem } from '@ValenceClient/jellyfin/mediaSummaryOfJellyfinItem';
import { profileOfJellyfinUser } from '@ValenceClient/jellyfin/profileOfJellyfinUser';
import { progressOfJellyfinItem } from '@ValenceClient/jellyfin/progressOfJellyfinItem';
import { sessionOfJellyfinUser } from '@ValenceClient/jellyfin/sessionOfJellyfinUser';
import { showDetailOfJellyfin } from '@ValenceClient/jellyfin/showDetailOfJellyfin';
import { showSummaryOfJellyfinSeries } from '@ValenceClient/jellyfin/showSummaryOfJellyfinSeries';
import { startedSessionOfJellyfin } from '@ValenceClient/jellyfin/startedSessionOfJellyfin';
import { TICKS_PER_SECOND } from '@ValenceClient/jellyfin/secondsOfJellyfinTicks';
import {
  JellyfinAuthenticationSchema,
  JellyfinItemSchema,
  JellyfinItemsSchema,
  JellyfinPlaybackInfoSchema,
  JellyfinUserSchema,
} from '@ValenceClient/jellyfin/JellyfinSchemas';
import type { JellyfinIdBook } from '@ValenceClient/jellyfin/createJellyfinIdBook';
import type { JellyfinItem } from '@ValenceClient/jellyfin/JellyfinSchemas';
import type { JellyfinLink } from '@ValenceClient/jellyfin/JellyfinLink';
import type { jellyfinLinks } from '@ValenceClient/jellyfin/jellyfinLinks';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type JellyfinDevice = { app: string; device: string; deviceId: string; version: string };

type JellyfinAnswering = {
  links: ReturnType<typeof jellyfinLinks>;
  book: JellyfinIdBook;
  send: (input: string, init?: RequestInit) => Promise<Response>;
  device: () => JellyfinDevice;
};

type Asked = { method: string; url: URL; body: JsonValue | null };

type Playing = { itemId: string; mediaSourceId: string; positionTicks: number };

const FIELDS = 'DateCreated,Genres,Overview,ProviderIds,MediaSources,ChildCount,RecursiveItemCount';

const MOST_AT_ONCE = 500;

const FEATURES = ['server.reportsFeatures', 'profiles.chosenPerSession', 'library.upNext'];

const SignInSchema = z.object({
  email: z.string().optional(),
  username: z.string().optional(),
  password: z.string(),
});

const ProgressReportSchema = z.object({
  positionSeconds: z.number().nonnegative(),
  durationSeconds: z.number().positive().optional(),
  isFinished: z.boolean().optional(),
});

const StartSchema = z.object({
  deviceProfile: DeviceProfileSchema,
  startSeconds: z.number().nonnegative().optional(),
  audioStreamIndex: z.number().int().nonnegative().optional(),
  subtitleStreamIndex: z.number().int().nonnegative().optional(),
});

const SORTS: Readonly<Record<string, { by: string; order: string }>> = {
  title: { by: 'SortName', order: 'Ascending' },
  newest: { by: 'DateCreated', order: 'Descending' },
  rated: { by: 'CommunityRating', order: 'Descending' },
  yourRating: { by: 'CommunityRating', order: 'Descending' },
};

/**
 * An answer as one of Valence's endpoints gives it.
 *
 * @param value - What it answers with, where anything.
 * @param status - Its status.
 * @returns The answer.
 */
const answered = (value: object | null, status = 200): Response =>
  new Response(status === 204 ? null : JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/**
 * A refusal as Valence's endpoints give one, for something a Jellyfin server does not do.
 *
 * @param status - Its status.
 * @returns The refusal.
 */
const refused = (status = 404): Response => {
  const said = saying('client.jellyfin.aJellyfinServerDoesNotDoThat');

  return answered({ error: said.message, code: said.code, values: {} }, status);
};

/**
 * Answers Valence's own endpoints from a Jellyfin server, for an app connected to one: signing in as
 * a Jellyfin user, that user as the account's one profile, the views as libraries, films, series and
 * episodes as Valence describes them, playback through Jellyfin's own decision of whether to send
 * the file or convert it, and progress and favourites written back to Jellyfin. Everything else a
 * Valence server does is refused as something this server does not do, and the server reports so
 * few features that the app does not offer it.
 *
 * @param answering - The links to Jellyfin servers, the identifier book, how to reach a server, and
 *   what to call this device.
 * @returns How to answer one request for a linked server.
 */
const createJellyfinAnswers = ({ links, book, send, device }: JellyfinAnswering) => {
  const playing = new Map<string, Playing>();

  const authorization = (link: JellyfinLink): string => {
    const { app, device: named, deviceId, version } = device();
    const fields = [
      `Client="${app}"`,
      `Device="${encodeURIComponent(named)}"`,
      `DeviceId="${deviceId}"`,
      `Version="${version}"`,
      ...(link.token === null ? [] : [`Token="${link.token}"`]),
    ];

    return `MediaBrowser ${fields.join(', ')}`;
  };

  const ask = (
    link: JellyfinLink,
    path: string,
    init: { method?: string; body?: object } = {},
  ): Promise<Response> =>
    send(`${link.address}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        authorization: authorization(link),
        accept: 'application/json',
        ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });

  const read = async <Value>(
    link: JellyfinLink,
    path: string,
    schema: {
      safeParse: (value: JsonValue) => { success: true; data: Value } | { success: false };
    },
    init: { method?: string; body?: object } = {},
  ): Promise<Value | null> => {
    const answer = await ask(link, path, init).catch(() => null);

    if (answer === null || !answer.ok) {
      return null;
    }

    const body = JsonValueSchema.safeParse(await answer.json().catch(() => null));
    const parsed = body.success ? schema.safeParse(body.data) : null;

    return parsed?.success === true ? parsed.data : null;
  };

  const contextOf = (link: JellyfinLink) => ({ address: link.address, book });

  const views = async (link: JellyfinLink): Promise<JellyfinItem[]> =>
    (await read(link, `/UserViews?userId=${link.userId ?? ''}`, JellyfinItemsSchema))?.Items.filter(
      isJellyfinVideoView,
    ) ?? [];

  const items = async (
    link: JellyfinLink,
    query: Record<string, string>,
  ): Promise<JellyfinItem[]> =>
    (
      await read(
        link,
        `/Items?${new URLSearchParams({ userId: link.userId ?? '', Fields: FIELDS, ...query }).toString()}`,
        JellyfinItemsSchema,
      )
    )?.Items ?? [];

  const libraryOf = async (link: JellyfinLink, jellyfinId: string): Promise<string | null> => {
    const known = (await views(link)).map((view) => view.Id);
    const ancestors =
      (await read(
        link,
        `/Items/${jellyfinId}/Ancestors?userId=${link.userId ?? ''}`,
        z.array(JellyfinItemSchema),
      )) ?? [];
    const library = ancestors.find((one) => known.includes(one.Id));

    return library === undefined ? null : book.valenceIdOf(library.Id);
  };

  const listIn = async (
    link: JellyfinLink,
    libraryIds: readonly string[],
    url: URL,
  ): Promise<{ items: MediaSummary[]; total: number }> => {
    const viewsHere = await views(link);
    const sort = SORTS[url.searchParams.get('order') ?? 'title'] ?? SORTS['title'];
    const search = url.searchParams.get('search');
    const ids = url.searchParams.get('ids');
    const limit = Number(url.searchParams.get('limit') ?? MOST_AT_ONCE);
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const kind = url.searchParams.get('kind');
    const found = (
      await Promise.all(
        libraryIds.map(async (libraryId) => {
          const view = viewsHere.find((one) => book.valenceIdOf(one.Id) === libraryId);

          if (view === undefined) {
            return [];
          }

          const isFilms = view.CollectionType === 'movies';

          if ((kind === 'films' && !isFilms) || (kind === 'shows' && isFilms)) {
            return [];
          }

          const listed = await items(link, {
            ParentId: view.Id,
            Recursive: 'true',
            IncludeItemTypes: isFilms ? 'Movie' : 'Episode',
            SortBy: sort?.by ?? 'SortName',
            SortOrder: sort?.order ?? 'Ascending',
            Limit: MOST_AT_ONCE.toString(),
            ...(search === null || search === '' ? {} : { SearchTerm: search }),
            ...(ids === null || ids === ''
              ? {}
              : {
                  Ids: ids
                    .split(',')
                    .map((one) => book.jellyfinIdOf(one))
                    .join(','),
                }),
          });

          return listed.map((item) => mediaSummaryOfJellyfinItem(item, libraryId, contextOf(link)));
        }),
      )
    ).flat();

    return { items: found.slice(offset, offset + limit), total: found.length };
  };

  const signIn = async (link: JellyfinLink, body: JsonValue | null): Promise<Response> => {
    const asked = SignInSchema.safeParse(body);

    if (!asked.success) {
      return answered({ code: 'INVALID_EMAIL_OR_PASSWORD', message: '' }, 400);
    }

    const signedIn = await read(link, '/Users/AuthenticateByName', JellyfinAuthenticationSchema, {
      method: 'POST',
      body: { Username: asked.data.username ?? asked.data.email ?? '', Pw: asked.data.password },
    });

    if (signedIn === null) {
      return answered({ code: 'INVALID_EMAIL_OR_PASSWORD', message: '' }, 401);
    }

    links.keep({
      ...link,
      token: signedIn.AccessToken,
      userId: signedIn.User.Id,
      userName: signedIn.User.Name,
      isAdministrator: signedIn.User.Policy?.IsAdministrator === true,
    });

    const session = sessionOfJellyfinUser(signedIn.User, book);

    return answered({ redirect: false, token: session.session.token, user: session.user });
  };

  const me = (link: JellyfinLink) =>
    link.token === null ? Promise.resolve(null) : read(link, '/Users/Me', JellyfinUserSchema);

  const startPlayback = async (
    link: JellyfinLink,
    mediaId: string,
    body: JsonValue | null,
  ): Promise<Response> => {
    const asked = StartSchema.safeParse(body);

    if (!asked.success) {
      return refused(400);
    }

    const jellyfinId = book.jellyfinIdOf(mediaId);
    const info = await read(
      link,
      `/Items/${jellyfinId}/PlaybackInfo?userId=${link.userId ?? ''}`,
      JellyfinPlaybackInfoSchema,
      {
        method: 'POST',
        body: {
          DeviceProfile: jellyfinProfileOfDevice(asked.data.deviceProfile),
          StartTimeTicks: Math.round((asked.data.startSeconds ?? 0) * TICKS_PER_SECOND),
          AutoOpenLiveStream: true,
          EnableDirectPlay: true,
          EnableDirectStream: true,
          EnableTranscoding: true,
          ...(asked.data.audioStreamIndex === undefined
            ? {}
            : { AudioStreamIndex: asked.data.audioStreamIndex }),
          ...(asked.data.subtitleStreamIndex === undefined
            ? {}
            : { SubtitleStreamIndex: asked.data.subtitleStreamIndex }),
        },
      },
    );
    const source = info?.MediaSources[0];

    if (info === null || source === undefined || link.token === null) {
      return refused(422);
    }

    const playSessionId = info.PlaySessionId ?? `${jellyfinId}-${Date.now().toString()}`;
    const positionTicks = Math.round((asked.data.startSeconds ?? 0) * TICKS_PER_SECOND);

    playing.set(playSessionId, { itemId: jellyfinId, mediaSourceId: source.Id, positionTicks });
    await ask(link, '/Sessions/Playing', {
      method: 'POST',
      body: {
        ItemId: jellyfinId,
        MediaSourceId: source.Id,
        PlaySessionId: playSessionId,
        PositionTicks: positionTicks,
      },
    }).catch(() => null);

    return answered(
      startedSessionOfJellyfin(source, playSessionId, mediaId, jellyfinId, {
        address: link.address,
        token: link.token,
      }),
    );
  };

  const recordProgress = async (
    link: JellyfinLink,
    mediaId: string,
    body: JsonValue | null,
  ): Promise<Response> => {
    const report = ProgressReportSchema.safeParse(body);

    if (!report.success) {
      return refused(400);
    }

    const jellyfinId = book.jellyfinIdOf(mediaId);
    const positionTicks = Math.round(report.data.positionSeconds * TICKS_PER_SECOND);

    for (const [, play] of playing) {
      if (play.itemId === jellyfinId) {
        play.positionTicks = positionTicks;
      }
    }

    await ask(link, `/UserItems/${jellyfinId}/UserData?userId=${link.userId ?? ''}`, {
      method: 'POST',
      body: { PlaybackPositionTicks: report.data.isFinished === true ? 0 : positionTicks },
    });

    if (report.data.isFinished === true) {
      await ask(link, `/UserPlayedItems/${jellyfinId}?userId=${link.userId ?? ''}`, {
        method: 'POST',
      });
    }

    return answered(null, 204);
  };

  const answerFor = async (link: JellyfinLink, { method, url, body }: Asked): Promise<Response> => {
    const path = url.pathname;
    const at = (pattern: RegExp) => pattern.exec(path);
    const signedIn = link.token !== null && link.userId !== null;

    if (method === 'GET' && path === '/api/health') {
      return answered({ status: 'ok', transcoderReachable: true });
    }

    if (method === 'GET' && path === '/api/about') {
      return answered({ features: FEATURES });
    }

    if (method === 'GET' && path === '/api/setup/status') {
      return answered({
        isComplete: true,
        isFlowOpen: false,
        detectedOrigin: link.address,
        isSecureContext: link.address.startsWith('https:'),
        suggestedTrustedOrigins: [],
        isTelemetryOffByEnvironment: true,
      });
    }

    if (method === 'POST' && /^\/api\/auth\/sign-in\/(email|username)$/u.test(path)) {
      return signIn(link, body);
    }

    if (method === 'GET' && path === '/api/auth/get-session') {
      const user = await me(link);

      if (user === null) {
        return answered(null);
      }

      return answered(sessionOfJellyfinUser(user, book));
    }

    if (method === 'POST' && path === '/api/auth/sign-out') {
      if (link.token !== null) {
        await ask(link, '/Sessions/Logout', { method: 'POST' }).catch(() => null);
      }

      links.keep({ ...link, token: null, userId: null, userName: null, isAdministrator: false });

      return answered({ success: true });
    }

    if (!signedIn) {
      return refused(401);
    }

    if (method === 'GET' && path === '/api/profiles') {
      const user = await me(link);
      const profile = user === null ? null : profileOfJellyfinUser(user, book);

      return answered({
        profiles: profile === null ? [] : [profile],
        chosenProfileId: profile?.id ?? null,
      });
    }

    const choosing = at(/^\/api\/profiles\/([^/]+)\/choose$/u);

    if (method === 'POST' && choosing !== null) {
      const user = await me(link);

      return user === null ? refused(404) : answered(profileOfJellyfinUser(user, book));
    }

    if (method === 'GET' && path === '/api/account/permissions') {
      return answered({ permissions: [], newerPermissions: [], isAdministrator: false });
    }

    if (method === 'GET' && path === '/api/libraries') {
      return answered((await views(link)).map((view) => libraryOfJellyfinView(view, book)));
    }

    if (method === 'GET' && path === '/api/library-facets') {
      return answered({ genres: [], decades: [], maxRating: 10 });
    }

    const inLibrary = at(/^\/api\/libraries\/([^/]+)\/items$/u);

    if (method === 'GET' && inLibrary !== null) {
      return answered(await listIn(link, [inLibrary[1] ?? ''], url));
    }

    if (method === 'GET' && path === '/api/library-items') {
      const libraryIds = (url.searchParams.get('libraryIds') ?? '')
        .split(',')
        .filter((one) => one !== '');

      return answered(await listIn(link, libraryIds, url));
    }

    const shows = at(/^\/api\/libraries\/([^/]+)\/shows$/u);

    if (method === 'GET' && shows !== null) {
      const libraryId = shows[1] ?? '';
      const series = await items(link, {
        ParentId: book.jellyfinIdOf(libraryId),
        Recursive: 'true',
        IncludeItemTypes: 'Series',
        SortBy: 'SortName',
      });

      return answered({
        shows: series.map((one) => showSummaryOfJellyfinSeries(one, libraryId, contextOf(link))),
      });
    }

    const show = at(/^\/api\/libraries\/([^/]+)\/shows\/([^/]+)$/u);

    if (method === 'GET' && show !== null) {
      const libraryId = show[1] ?? '';
      const seriesId = book.jellyfinIdOf(show[2] ?? '');
      const series = await read(
        link,
        `/Users/${link.userId ?? ''}/Items/${seriesId}`,
        JellyfinItemSchema,
      );
      const episodes = await read(
        link,
        `/Shows/${seriesId}/Episodes?${new URLSearchParams({ userId: link.userId ?? '', Fields: FIELDS }).toString()}`,
        JellyfinItemsSchema,
      );

      return series === null
        ? refused(404)
        : answered(showDetailOfJellyfin(series, episodes?.Items ?? [], libraryId, contextOf(link)));
    }

    const media = at(/^\/api\/media\/([^/]+)$/u);

    if (method === 'GET' && media !== null) {
      const jellyfinId = book.jellyfinIdOf(media[1] ?? '');
      const item = await read(
        link,
        `/Users/${link.userId ?? ''}/Items/${jellyfinId}`,
        JellyfinItemSchema,
      );
      const libraryId = item === null ? null : await libraryOf(link, jellyfinId);

      return item === null || libraryId === null
        ? refused(404)
        : answered(mediaDetailOfJellyfinItem(item, libraryId, contextOf(link)));
    }

    if (method === 'GET' && path === '/api/up-next') {
      const viewsHere = (await views(link)).filter((view) => view.CollectionType === 'tvshows');
      const episodes = await Promise.all(
        viewsHere.map(async (view) => {
          const next = await read(
            link,
            `/Shows/NextUp?${new URLSearchParams({ userId: link.userId ?? '', ParentId: view.Id, Fields: FIELDS }).toString()}`,
            JellyfinItemsSchema,
          );

          return (next?.Items ?? []).map((item) => ({
            episode: mediaSummaryOfJellyfinItem(item, book.valenceIdOf(view.Id), contextOf(link)),
            lastWatchedAt: new Date(item.UserData?.LastPlayedDate ?? Date.now()).toISOString(),
          }));
        }),
      );

      return answered({ episodes: episodes.flat() });
    }

    if (method === 'GET' && path === '/api/coming-up') {
      return answered({ shows: [] });
    }

    if (method === 'GET' && path === '/api/progress') {
      const [started, finished] = await Promise.all([
        items(link, {
          Recursive: 'true',
          IncludeItemTypes: 'Movie,Episode',
          Filters: 'IsResumable',
          Limit: MOST_AT_ONCE.toString(),
        }),
        items(link, {
          Recursive: 'true',
          IncludeItemTypes: 'Movie,Episode',
          Filters: 'IsPlayed',
          Limit: MOST_AT_ONCE.toString(),
        }),
      ]);

      return answered({
        progress: [...started, ...finished]
          .map((item) => progressOfJellyfinItem(item, book))
          .filter((one) => one !== null),
      });
    }

    const progress = at(/^\/api\/media\/([^/]+)\/progress$/u);

    if (method === 'PUT' && progress !== null) {
      return recordProgress(link, progress[1] ?? '', body);
    }

    if (method === 'DELETE' && progress !== null) {
      const jellyfinId = book.jellyfinIdOf(progress[1] ?? '');

      await ask(link, `/UserPlayedItems/${jellyfinId}?userId=${link.userId ?? ''}`, {
        method: 'DELETE',
      });
      await ask(link, `/UserItems/${jellyfinId}/UserData?userId=${link.userId ?? ''}`, {
        method: 'POST',
        body: { PlaybackPositionTicks: 0 },
      });

      return answered(null, 204);
    }

    if (method === 'GET' && path === '/api/favourites') {
      const kept = await items(link, {
        Recursive: 'true',
        IncludeItemTypes: 'Movie,Episode',
        Filters: 'IsFavorite',
        Limit: MOST_AT_ONCE.toString(),
      });

      return answered({
        favourites: kept.map((item) => ({
          mediaId: book.valenceIdOf(item.Id),
          keptAt: new Date(item.UserData?.LastPlayedDate ?? item.DateCreated ?? 0).toISOString(),
        })),
        books: [],
      });
    }

    const favourite = at(/^\/api\/media\/([^/]+)\/favourite$/u);

    if ((method === 'PUT' || method === 'DELETE') && favourite !== null) {
      await ask(
        link,
        `/UserFavoriteItems/${book.jellyfinIdOf(favourite[1] ?? '')}?userId=${link.userId ?? ''}`,
        {
          method: method === 'PUT' ? 'POST' : 'DELETE',
        },
      );

      return answered(null, 204);
    }

    const starting = at(/^\/api\/playback\/([^/]+)\/session$/u);

    if (method === 'POST' && starting !== null && starting[1] !== 'session') {
      return startPlayback(link, starting[1] ?? '', body);
    }

    const stopping = at(/^\/api\/playback\/session\/([^/]+)$/u);

    if (method === 'DELETE' && stopping !== null) {
      const sessionId = stopping[1] ?? '';
      const play = playing.get(sessionId);

      if (play !== undefined) {
        playing.delete(sessionId);
        await ask(link, '/Sessions/Playing/Stopped', {
          method: 'POST',
          body: {
            ItemId: play.itemId,
            MediaSourceId: play.mediaSourceId,
            PlaySessionId: sessionId,
            PositionTicks: play.positionTicks,
          },
        }).catch(() => null);
      }

      return answered(null, 204);
    }

    if (
      method === 'POST' &&
      /^\/api\/playback\/(session\/[^/]+\/(heartbeat|begin)|problems)$/u.test(path)
    ) {
      return answered(null, 204);
    }

    return refused(404);
  };

  return {
    answer: async (link: JellyfinLink, request: Request): Promise<Response> => {
      const text =
        request.method === 'GET' || request.method === 'HEAD' ? '' : await request.text();
      let body: JsonValue | null = null;

      try {
        body = text === '' ? null : JsonValueSchema.parse(JSON.parse(text));
      } catch {
        body = null;
      }

      return answerFor(links.of(link.address) ?? link, {
        method: request.method.toUpperCase(),
        url: new URL(request.url),
        body,
      });
    },
  };
};

type JellyfinAnswers = ReturnType<typeof createJellyfinAnswers>;

export type { JellyfinAnswers, JellyfinDevice };

export { createJellyfinAnswers };
