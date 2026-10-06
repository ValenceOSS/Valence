import { seededShuffle } from './seededShuffle';
import type { CatalogueSong } from '@ValenceServer/music/MusicService';
import type { Mix } from './Mix';
import type { PlayCount } from './MusicPlays';
import { say } from '@ValenceI18n/say';

const DAY_MS = 86_400_000;

const MIX_LENGTH = 50;

const REPEAT_LENGTH = 30;

const ENOUGH_FOR_A_MIX = 20;

const ENOUGH_FOR_A_LIST = 5;

const MOST_DAILY = 4;

const MOST_GENRES = 6;

const MOST_DECADES = 4;

const FAMILIAR_SHARE = 0.6;

type MixMaterial = {
  songs: readonly CatalogueSong[];
  lately: readonly PlayCount[];
  overTheYear: readonly PlayCount[];
  liked: ReadonlySet<string>;
  nowMs: number;
  seed: string;
};

/**
 * The name of a genre as a mix's address, lower case with hyphens.
 *
 * @param genre - The genre.
 * @returns Its slug.
 */
const slugOf = (genre: string): string =>
  genre
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');

/**
 * The genre an artist is most often filed under, across the songs of theirs there are.
 *
 * @param songs - The songs there are.
 * @returns Each artist's genre, where they have one.
 */
const genreOfEachArtist = (songs: readonly CatalogueSong[]): Map<string, string> => {
  const tallies = new Map<string, Map<string, number>>();

  for (const song of songs) {
    for (const artist of song.artists) {
      const tally = tallies.get(artist.id) ?? new Map<string, number>();

      for (const genre of song.genres) {
        tally.set(genre, (tally.get(genre) ?? 0) + 1);
      }

      tallies.set(artist.id, tally);
    }
  }

  return new Map(
    [...tallies].flatMap(([artistId, tally]) => {
      const top = [...tally].sort((one, other) => other[1] - one[1])[0];

      return top === undefined ? [] : [[artistId, top[0]] as const];
    }),
  );
};

/**
 * The mixes Valence makes for one profile, from the music it may hear and what it has heard: a few
 * daily mixes, each a cluster of the artists it plays together with music like them it has not
 * heard; what it has had on repeat this month; what it played a lot and has let go quiet; and one
 * mix for each genre and each decade there is plenty of.
 *
 * Every mix is in an order that holds for the day and changes the next, from the seed. A mix with
 * too little in it to be worth playing is left out rather than made thin.
 *
 * @param material - The music, the hearings, the liked songs, the time and the day's seed.
 * @returns The mixes, the personal ones first.
 */
const buildMixes = ({ songs, lately, overTheYear, liked, nowMs, seed }: MixMaterial): Mix[] => {
  const byId = new Map(songs.map((song) => [song.id, song]));
  const heardLately = new Map(lately.map((count) => [count.trackId, count]));
  const mixes: Omit<Mix, 'coverAlbumIds'>[] = [];

  const onRepeat = lately
    .filter((count) => count.plays >= 2 && count.lastPlayedAtMs >= nowMs - 30 * DAY_MS)
    .filter((count) => byId.has(count.trackId))
    .sort((one, other) => other.plays - one.plays || other.lastPlayedAtMs - one.lastPlayedAtMs)
    .slice(0, REPEAT_LENGTH)
    .map((count) => count.trackId);

  const artistPlays = new Map<string, number>();

  for (const count of lately) {
    for (const artist of byId.get(count.trackId)?.artists ?? []) {
      artistPlays.set(artist.id, (artistPlays.get(artist.id) ?? 0) + count.plays);
    }
  }

  const genreOf = genreOfEachArtist(songs);
  const clusters = new Map<string, { artists: Set<string>; weight: number }>();

  for (const [artistId, plays] of artistPlays) {
    const genre = genreOf.get(artistId) ?? '';
    const cluster = clusters.get(genre) ?? { artists: new Set<string>(), weight: 0 };

    cluster.artists.add(artistId);
    cluster.weight += plays;
    clusters.set(genre, cluster);
  }

  [...clusters]
    .sort((one, other) => other[1].weight - one[1].weight)
    .slice(0, MOST_DAILY)
    .forEach(([genre, cluster], at) => {
      const isTheirs = (song: CatalogueSong) =>
        song.artists.some((artist) => cluster.artists.has(artist.id));
      const familiar = seededShuffle(songs.filter(isTheirs), `${seed}:daily:${at.toString()}`);
      const fresh =
        genre === ''
          ? []
          : seededShuffle(
              songs.filter(
                (song) =>
                  !isTheirs(song) && song.genres.includes(genre) && !heardLately.has(song.id),
              ),
              `${seed}:fresh:${at.toString()}`,
            );
      const keep = Math.round(MIX_LENGTH * FAMILIAR_SHARE);
      const chosen = seededShuffle(
        [
          ...familiar.slice(0, keep),
          ...fresh.slice(0, MIX_LENGTH - Math.min(keep, familiar.length)),
        ],
        `${seed}:together:${at.toString()}`,
      );
      const names = [...cluster.artists]
        .sort((one, other) => (artistPlays.get(other) ?? 0) - (artistPlays.get(one) ?? 0))
        .slice(0, 3)
        .flatMap(
          (artistId) =>
            songs.flatMap((song) => song.artists).find((artist) => artist.id === artistId)?.name ??
            [],
        );

      if (chosen.length >= ENOUGH_FOR_A_MIX / 2) {
        mixes.push({
          id: `daily-${(mixes.filter((mix) => mix.kind === 'daily').length + 1).toString()}`,
          kind: 'daily',
          title: say('server.music.mixes.dailyMix', {
            number: (mixes.filter((mix) => mix.kind === 'daily').length + 1).toString(),
          }),
          detail: names.join(', '),
          trackIds: chosen.map((song) => song.id),
        });
      }
    });

  if (onRepeat.length >= ENOUGH_FOR_A_LIST) {
    mixes.push({
      id: 'on-repeat',
      kind: 'onRepeat',
      title: say('server.music.mixes.onRepeat'),
      detail: say('server.music.mixes.onRepeatDetail'),
      trackIds: onRepeat,
    });
  }

  const rediscover = overTheYear
    .filter(
      (count) =>
        count.plays >= 3 &&
        count.lastPlayedAtMs < nowMs - 60 * DAY_MS &&
        !heardLately.has(count.trackId) &&
        byId.has(count.trackId),
    )
    .sort((one, other) => other.plays - one.plays)
    .slice(0, REPEAT_LENGTH)
    .map((count) => count.trackId);

  if (rediscover.length >= ENOUGH_FOR_A_LIST) {
    mixes.push({
      id: 'rediscover',
      kind: 'rediscover',
      title: say('server.music.mixes.rediscover'),
      detail: say('server.music.mixes.rediscoverDetail'),
      trackIds: rediscover,
    });
  }

  const byGenre = new Map<string, CatalogueSong[]>();

  for (const song of songs) {
    for (const genre of song.genres) {
      byGenre.set(genre, [...(byGenre.get(genre) ?? []), song]);
    }
  }

  const liking = (song: CatalogueSong) =>
    (liked.has(song.id) ? 2 : 0) + (heardLately.get(song.id)?.plays ?? 0);

  [...byGenre]
    .filter(([, inIt]) => inIt.length >= ENOUGH_FOR_A_MIX)
    .sort(
      (one, other) =>
        other[1].reduce((sum, song) => sum + liking(song), other[1].length) -
        one[1].reduce((sum, song) => sum + liking(song), one[1].length),
    )
    .slice(0, MOST_GENRES)
    .forEach(([genre, inIt]) => {
      mixes.push({
        id: `genre-${slugOf(genre)}`,
        kind: 'genre',
        title: say('server.music.mixes.genreMix', { genre }),
        detail: say('server.music.mixes.genreMixDetail', { genre }),
        trackIds: seededShuffle(inIt, `${seed}:genre:${genre}`)
          .slice(0, MIX_LENGTH)
          .map((song) => song.id),
      });
    });

  const byDecade = new Map<number, CatalogueSong[]>();

  for (const song of songs) {
    if (song.year !== null && song.year > 0) {
      const decade = Math.floor(song.year / 10) * 10;

      byDecade.set(decade, [...(byDecade.get(decade) ?? []), song]);
    }
  }

  [...byDecade]
    .filter(([, inIt]) => inIt.length >= ENOUGH_FOR_A_MIX)
    .sort((one, other) => other[1].length - one[1].length)
    .slice(0, MOST_DECADES)
    .sort((one, other) => other[0] - one[0])
    .forEach(([decade, inIt]) => {
      mixes.push({
        id: `decade-${decade.toString()}`,
        kind: 'decade',
        title: say('server.music.mixes.decadeMix', { decade: decade.toString() }),
        detail: say('server.music.mixes.decadeMixDetail', { decade: decade.toString() }),
        trackIds: seededShuffle(inIt, `${seed}:decade:${decade.toString()}`)
          .slice(0, MIX_LENGTH)
          .map((song) => song.id),
      });
    });

  return mixes.map((mix) => ({
    ...mix,
    coverAlbumIds: [
      ...new Set(
        mix.trackIds.flatMap((trackId) => {
          const song = byId.get(trackId);

          return song === undefined || !song.hasArtwork ? [] : [song.albumId];
        }),
      ),
    ].slice(0, 4),
  }));
};

export type { MixMaterial };

export { buildMixes };
