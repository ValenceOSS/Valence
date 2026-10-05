import { albumsOfMissingSongs } from '@ValenceServer/requests/missingAlbums/albumsOfMissingSongs';
import type { MusicCatalogueHit } from '@ValenceContracts/schemas/MediaRequest';
import type { PlaylistMissingSong } from '@ValenceContracts/schemas/Playlist';
import type { PlaylistService } from '@ValenceServer/playlists/PlaylistService';
import type {
  MatchedAlbum,
  MissingAlbumMatch,
  MissingAlbumMatcher,
} from '@ValenceServer/requests/missingAlbums/MissingAlbumMatcher';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type Run = {
  keys: string;
  isMatching: boolean;
  albums: MatchedAlbum[];
  finishedAt: number | null;
  done: Promise<void>;
};

type Known = { hit: MusicCatalogueHit | null; at: number };

const A_DAY_MS = 24 * 60 * 60 * 1000;

const AN_HOUR_MS = 60 * 60 * 1000;

const SAYS_WHEN_DONE_AFTER_MS = 10_000;

const MOST_KNOWN = 20_000;

/**
 * Finds the albums of playlists' missing songs in the background, so the person asking need not
 * wait on the page: one run for each person's playlist, joined rather than started again while it
 * is under way, and started afresh only when what is missing has changed. Every album found is
 * remembered for a day — one not found for an hour, in case MusicBrainz was only unreachable — so a
 * run over a playlist looked at before, or next week's version of it, asks only about what is new.
 * A run that takes long enough for the person to have gone elsewhere says when it is done, and one
 * can be waited on for a while, for a caller with nobody watching it, such as a plugin.
 *
 * @param options - The playlists, how to find many songs' albums at once, what to do when a long run
 *   is done, and — for a test — the time.
 * @returns A way to start or join a playlist's run and read how far it has got, and one to wait a
 *   while for it to be done.
 */
const createMissingAlbumMatcher = ({
  playlists,
  find,
  onDone,
  now = () => Date.now(),
}: {
  playlists: Pick<PlaylistService, 'read'>;
  find: (songs: readonly PlaylistMissingSong[]) => Promise<(MusicCatalogueHit | null)[]>;
  onDone: (
    viewer: Extract<Viewer, { kind: 'account' }>,
    playlist: { id: string; name: string },
    tally: { found: number; albums: number },
  ) => void;
  now?: () => number;
}): MissingAlbumMatcher => {
  const known = new Map<string, Known>();
  const runs = new Map<string, Run>();

  const remembered = (key: string): MusicCatalogueHit | null | undefined => {
    const kept = known.get(key);

    if (kept === undefined) {
      return undefined;
    }

    if (now() - kept.at > (kept.hit === null ? AN_HOUR_MS : A_DAY_MS)) {
      known.delete(key);

      return undefined;
    }

    return kept.hit;
  };

  const remember = (key: string, hit: MusicCatalogueHit | null) => {
    known.delete(key);
    known.set(key, { hit, at: now() });

    for (const oldest of known.keys()) {
      if (known.size <= MOST_KNOWN) {
        break;
      }

      known.delete(oldest);
    }
  };

  const viewOf = (run: Run): MissingAlbumMatch => ({
    isMatching: run.isMatching,
    albums: run.albums.map((album) => ({ ...album })),
  });

  const work = async (
    run: Run,
    viewer: Extract<Viewer, { kind: 'account' }>,
    playlist: { id: string; name: string },
  ) => {
    const startedAt = now();
    const asking = run.albums.filter((album) => album.hit === undefined);
    const hits = await find(asking.map((album) => album.song)).catch(() => asking.map(() => null));

    asking.forEach((album, at) => {
      const hit = hits[at] ?? null;

      remember(album.key, hit);
      album.hit = hit;
    });

    run.isMatching = false;
    run.finishedAt = now();

    if (run.finishedAt - startedAt >= SAYS_WHEN_DONE_AFTER_MS) {
      onDone(viewer, playlist, {
        found: run.albums.filter((album) => album.hit !== null).length,
        albums: run.albums.length,
      });
    }
  };

  const start = async (
    viewer: Extract<Viewer, { kind: 'account' }>,
    playlistId: string,
  ): Promise<Run | null> => {
    const read = await playlists.read(viewer, playlistId);

    if (read === null) {
      return null;
    }

    for (const [key, run] of runs) {
      if (run.finishedAt !== null && now() - run.finishedAt > AN_HOUR_MS) {
        runs.delete(key);
      }
    }

    const grouped = albumsOfMissingSongs(
      read.entries.flatMap((entry) => (entry.missing === null ? [] : [entry.missing])),
    );
    const keys = grouped.map((album) => album.key).join('\n');
    const runKey = `${viewer.profileId ?? viewer.accountId}:${playlistId}`;
    const running = runs.get(runKey);

    if (running !== undefined && (running.isMatching || running.keys === keys)) {
      return running;
    }

    const albums = grouped.map((album) => ({ ...album, hit: remembered(album.key) }));
    const run: Run = {
      keys,
      isMatching: albums.some((album) => album.hit === undefined),
      albums,
      finishedAt: null,
      done: Promise.resolve(),
    };

    runs.set(runKey, run);

    if (run.isMatching) {
      run.done = work(run, viewer, { id: read.playlist.id, name: read.playlist.name });
    } else {
      run.finishedAt = now();
    }

    return run;
  };

  return {
    match: async (viewer, playlistId) => {
      const run = await start(viewer, playlistId);

      return run === null ? null : viewOf(run);
    },
    settle: async (viewer, playlistId, withinMs) => {
      const run = await start(viewer, playlistId);

      if (run === null) {
        return null;
      }

      await Promise.race([
        run.done,
        new Promise<void>((resolve) => {
          setTimeout(resolve, withinMs).unref();
        }),
      ]);

      return viewOf(run);
    },
  };
};

export { createMissingAlbumMatcher };
