import { buildMixes } from './buildMixes';
import type { MusicService } from '@ValenceServer/music/MusicService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { Mix } from './Mix';
import type { MusicPlays } from './MusicPlays';

const DAY_MS = 86_400_000;

type Mixes = {
  list: (viewer: Viewer) => Promise<Mix[]>;
  read: (viewer: Viewer, mixId: string) => Promise<Mix | null>;
  forget: (profileId: string) => void;
};

type MixesOptions = {
  music: Pick<MusicService, 'listCatalogue' | 'listLiked'>;
  plays: MusicPlays;
  now?: () => number;
};

/**
 * The mixes Valence makes for each profile, made once a day and kept until the next: the music a
 * profile may hear changes rarely and what it has heard slowly, so remaking them on every look
 * would cost a reading of the whole library for the same answer.
 *
 * Only a profile has mixes — a guest on a share link or the server itself has none — and what a
 * profile may hear is read through the same visibility as the rest of the library.
 *
 * @param music - Where the songs a profile may hear, and those it likes, are read from.
 * @param plays - What each profile has heard.
 * @param now - The clock.
 * @returns The mixes.
 */
const createMixes = ({ music, plays, now = Date.now }: MixesOptions): Mixes => {
  const made = new Map<string, { day: number; mixes: Promise<Mix[]> }>();

  const list = (viewer: Viewer): Promise<Mix[]> => {
    if (viewer.kind !== 'account' || viewer.profileId === null) {
      return Promise.resolve([]);
    }

    const { profileId } = viewer;
    const at = now();
    const day = Math.floor(at / DAY_MS);
    const kept = made.get(profileId);

    if (kept !== undefined && kept.day === day) {
      return kept.mixes;
    }

    const mixes = Promise.all([
      music.listCatalogue(viewer),
      music.listLiked(viewer),
      plays.countsSince(profileId, at - 90 * DAY_MS),
      plays.countsSince(profileId, at - 365 * DAY_MS),
    ]).then(([songs, liked, lately, overTheYear]) =>
      buildMixes({
        songs,
        lately,
        overTheYear,
        liked: new Set(liked.map((track) => track.id)),
        nowMs: at,
        seed: `${profileId}:${day.toString()}`,
      }),
    );

    made.set(profileId, { day, mixes });
    mixes.catch(() => {
      made.delete(profileId);
    });

    return mixes;
  };

  return {
    list,
    read: async (viewer, mixId) => (await list(viewer)).find((mix) => mix.id === mixId) ?? null,
    forget: (profileId) => {
      made.delete(profileId);
    },
  };
};

export type { Mixes };

export { createMixes };
