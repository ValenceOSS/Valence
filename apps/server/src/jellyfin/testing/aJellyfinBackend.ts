import { LibrarySchema } from '@ValenceContracts/schemas/Library';
import { aJellyfinCaller } from '@ValenceServer/jellyfin/testing/aJellyfinCaller';
import { aJellyfinDetail } from '@ValenceServer/jellyfin/testing/aJellyfinDetail';
import { aJellyfinFilm } from '@ValenceServer/jellyfin/testing/aJellyfinFilm';
import { aJellyfinShow } from '@ValenceServer/jellyfin/testing/aJellyfinShow';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import type { JellyfinBackend } from '@ValenceServer/jellyfin/JellyfinBackend';

type Recorded = {
  progress: { mediaId: string; positionSeconds: number; durationSeconds: number }[];
  forgotten: string[];
  favourites: { mediaId: string; isFavourite: boolean }[];
  started: string[];
  stopped: string[];
  signedOut: number;
};

/**
 * A stand-in for Valence behind the Jellyfin endpoints: a film library holding one film, a
 * programme library holding one programme of two seasons, one person signed in with the token
 * `s.a-session`, and a record of everything written, with whatever a test cares about changed.
 *
 * @param change - What differs.
 * @returns The stand-in and what was written to it.
 */
const aJellyfinBackend = (change: Partial<JellyfinBackend> = {}) => {
  const film = aJellyfinFilm();
  const show = aJellyfinShow();
  const episodes = show.seasons.flatMap((season) => season.episodes);
  const everything = [film, ...episodes];
  const progress = new Map<string, WatchProgress>();
  const recorded: Recorded = {
    progress: [],
    forgotten: [],
    favourites: [],
    started: [],
    stopped: [],
    signedOut: 0,
  };
  const library = (id: string, name: string, kind: 'movies' | 'shows') =>
    LibrarySchema.parse({
      id,
      name,
      kind,
      path: `/media/${name}`,
      itemCount: 1,
      lastScannedAt: null,
      defaultAudioLanguage: null,
      filesAtOnce: null,
    });

  const backend: JellyfinBackend = {
    serverId: () => Promise.resolve('5e4f0e6fc495953351a9155472d8f6e6'),
    serverName: () => Promise.resolve('Valence'),
    signIn: (asked, origin) =>
      Promise.resolve(
        asked.password === 'correct'
          ? { kind: 'signedIn', caller: aJellyfinCaller({ origin }) }
          : {
              kind: 'refused',
              status: 401,
              refusal: {
                error: 'wrong',
                code: 'server.jellyfin.thatNameOrPasswordIsWrong',
                values: {},
              },
            },
      ),
    signOut: () => {
      recorded.signedOut += 1;

      return Promise.resolve();
    },
    callerOf: (token, origin) =>
      Promise.resolve(token === 's.a-session' ? aJellyfinCaller({ origin }) : null),
    libraries: () =>
      Promise.resolve([
        library(film.libraryId, 'Films', 'movies'),
        library(show.libraryId, 'Shows', 'shows'),
      ]),
    listItems: (_caller, libraryIds, options) => {
      const items = everything.filter(
        (one) =>
          libraryIds.includes(one.libraryId) &&
          (options.ids === undefined || options.ids.includes(one.id)) &&
          (options.search === undefined ||
            one.title.toLowerCase().includes(options.search.toLowerCase())),
      );

      return Promise.resolve({ items, total: items.length });
    },
    listShows: (_caller, libraryId) => Promise.resolve(libraryId === show.libraryId ? [show] : []),
    getShow: (_caller, libraryId, showId) =>
      Promise.resolve(libraryId === show.libraryId && showId === show.id ? show : null),
    getMedia: (_caller, mediaId) => {
      const found = everything.find((one) => one.id === mediaId);

      return Promise.resolve(found === undefined ? null : aJellyfinDetail(found));
    },
    upNext: () => Promise.resolve(episodes.slice(1)),
    progress: () => Promise.resolve([...progress.values()]),
    favourites: () => Promise.resolve([]),
    recordProgress: (_caller, mediaId, report) => {
      recorded.progress.push({ mediaId, ...report });
      progress.set(mediaId, {
        mediaId,
        ...report,
        isFinished: report.positionSeconds >= report.durationSeconds * 0.9,
        updatedAt: '2026-11-14T00:00:00.000Z',
      });

      return Promise.resolve(true);
    },
    forgetProgress: (_caller, mediaId) => {
      recorded.forgotten.push(mediaId);
      progress.delete(mediaId);

      return Promise.resolve(true);
    },
    setFavourite: (_caller, mediaId, isFavourite) => {
      recorded.favourites.push({ mediaId, isFavourite });

      return Promise.resolve(true);
    },
    startPlayback: (_caller, mediaId, asked) => {
      recorded.started.push(mediaId);

      return Promise.resolve(
        asked.deviceProfile.directPlayProfiles.some((one) => one.container === 'mkv')
          ? { kind: 'direct', sessionId: 'session-1' }
          : { kind: 'hls', sessionId: 'session-1', ticket: 'aTicket' },
      );
    },
    stopPlayback: (_caller, sessionId) => {
      recorded.stopped.push(sessionId);

      return Promise.resolve();
    },
    readSessionFile: (_origin, ticket, name) =>
      Promise.resolve(
        ticket === 'aTicket'
          ? new Response(`#EXTM3U ${name}`, {
              headers: { 'content-type': 'application/vnd.apple.mpegurl' },
            })
          : new Response(null, { status: 404 }),
      ),
    readDirectFile: () =>
      Promise.resolve(
        new Response('bytes', {
          status: 206,
          headers: { 'content-range': 'bytes 0-4/100', 'x-secret': 'kept back' },
        }),
      ),
    readArtwork: (name, width) =>
      Promise.resolve(
        name === 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
          ? { body: new TextEncoder().encode(`w${width ?? 0}`), contentType: 'image/webp' }
          : null,
      ),
    readAvatar: () =>
      Promise.resolve({ body: new TextEncoder().encode('face'), contentType: 'image/png' }),
    ...change,
  };

  return { backend, recorded, film, show };
};

export { aJellyfinBackend };
