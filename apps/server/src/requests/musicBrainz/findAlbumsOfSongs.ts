import { z } from 'zod';
import { nameKey } from '@ValenceServer/music/nameKey';
import { albumHitOf } from '@ValenceServer/requests/musicBrainz/albumHitOf';
import { baseTitleOf } from '@ValenceServer/requests/musicBrainz/baseTitleOf';
import { creditedArtistOf } from '@ValenceServer/requests/musicBrainz/creditedArtistOf';
import { escapedForMusicBrainz } from '@ValenceServer/requests/musicBrainz/escapedForMusicBrainz';
import { MusicBrainzReleaseGroupSchema } from '@ValenceServer/requests/musicBrainz/MusicBrainzReleaseGroupSchema';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicCatalogueHit } from '@ValenceContracts/schemas/MediaRequest';
import type { PlaylistMissingSong } from '@ValenceContracts/schemas/Playlist';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';
import type { MusicBrainzReleaseGroup } from '@ValenceServer/requests/musicBrainz/MusicBrainzReleaseGroupSchema';

const MOST_HITS = 100;

const ONE_SONGS_HITS = 10;

const RELEASES_AT_ONCE = 100;

const ALBUMS_AT_ONCE = 25;

const SONGS_AT_ONCE = 10;

const CreditSchema = MusicBrainzReleaseGroupSchema.shape['artist-credit'];

const UncreditedGroupSchema = MusicBrainzReleaseGroupSchema.omit({ 'artist-credit': true });

const ReleasesSchema = z.object({
  releases: z
    .array(
      z
        .object({
          id: z.string(),
          'artist-credit': CreditSchema,
          'release-group': UncreditedGroupSchema,
        })
        .nullable()
        .catch(null),
    )
    .catch([]),
});

const ReleaseGroupsSchema = z.object({
  'release-groups': z.array(MusicBrainzReleaseGroupSchema.nullable().catch(null)).catch([]),
});

const RecordingsSchema = z.object({
  recordings: z
    .array(
      z
        .object({
          title: z.string(),
          'artist-credit': CreditSchema,
          releases: z
            .array(z.object({ 'release-group': UncreditedGroupSchema }).nullable().catch(null))
            .catch([]),
        })
        .nullable()
        .catch(null),
    )
    .catch([]),
});

type Answer = { count: number; albumOf: (song: PlaylistMissingSong) => MusicCatalogueHit | null };

/**
 * Whether a credit names an artist, as "Bicep & Hammer" names Bicep.
 *
 * @param group - What the credit is on.
 * @param artist - The artist.
 * @returns Whether it does.
 */
const isCreditedTo = (group: Pick<MusicBrainzReleaseGroup, 'artist-credit'>, artist: string) =>
  nameKey(creditedArtistOf(group) ?? '').includes(nameKey(artist));

/**
 * One name of one artist, in the words MusicBrainz's query language reads, to be joined with
 * others into one search.
 *
 * @param field - What the name is of.
 * @param name - The name.
 * @param artist - The artist.
 * @returns The clause.
 */
const clauseFor = (field: 'releasegroup' | 'recording', name: string, artist: string) =>
  `(${field}:"${escapedForMusicBrainz(name)}" AND artist:"${escapedForMusicBrainz(artist)}")`;

/**
 * How well a kind of release stands for a song: an album first, then an EP or single, then
 * anything else, so a song on an album and a dozen compilations is asked for by its album.
 *
 * @param group - The release group.
 * @returns Its rank, lowest first.
 */
const rankOf = (group: Pick<MusicBrainzReleaseGroup, 'primary-type' | 'secondary-types'>) =>
  group['secondary-types'].length > 0
    ? 3
    : group['primary-type'] === 'Album'
      ? 0
      : group['primary-type'] === 'EP' || group['primary-type'] === 'Single'
        ? 1
        : 2;

/**
 * The songs in runs of so many at a time.
 *
 * @param songs - The songs.
 * @param size - How many to a run.
 * @returns The runs.
 */
const runsOf = <Each>(songs: readonly Each[], size: number): Each[][] =>
  Array.from({ length: Math.ceil(songs.length / size) }, (_, at) =>
    songs.slice(at * size, (at + 1) * size),
  );

/**
 * Reads a search for albums by name, finding each song's among them: the album of the name it
 * gave, give or take what an edition adds, by an artist it is credited to.
 *
 * @param answer - What MusicBrainz answered.
 * @returns How many albums it gave, and a way to find a song's among them.
 */
const readAlbums = (answer: JsonValue | null): Answer => {
  const read = ReleaseGroupsSchema.safeParse(answer);
  const groups = (read.success ? read.data['release-groups'] : []).flatMap((group) =>
    group === null ? [] : [group],
  );

  return {
    count: groups.length,
    albumOf: (song) => {
      const wanted = nameKey(baseTitleOf(song.album ?? ''));
      const found = groups.find(
        (group) => nameKey(baseTitleOf(group.title)) === wanted && isCreditedTo(group, song.artist),
      );

      return found === undefined ? null : albumHitOf(found);
    },
  };
};

/**
 * Reads a search for songs by name, finding the album each is best known from.
 *
 * @param answer - What MusicBrainz answered.
 * @returns How many songs it gave, and a way to find a song's album among them.
 */
const readRecordings = (answer: JsonValue | null): Answer => {
  const read = RecordingsSchema.safeParse(answer);
  const recordings = (read.success ? read.data.recordings : []).flatMap((recording) =>
    recording === null ? [] : [recording],
  );

  return {
    count: recordings.length,
    albumOf: (song) => {
      const [best] = recordings
        .flatMap((recording) =>
          nameKey(recording.title) !== nameKey(song.title) || !isCreditedTo(recording, song.artist)
            ? []
            : recording.releases.flatMap((release) =>
                release === null
                  ? []
                  : [{ ...release['release-group'], 'artist-credit': recording['artist-credit'] }],
              ),
        )
        .sort((one, other) => rankOf(one) - rankOf(other));

      return best === undefined ? null : albumHitOf(best);
    },
  };
};

/**
 * Searches for songs' albums by name, many songs to a search, then each song left over on its own
 * where a search came back so full that it may have been crowded out.
 *
 * @param web - The way out to the web.
 * @param songs - The songs, by where each answer goes.
 * @param search - Which of MusicBrainz's searches to ask, how many songs to ask at once, how to say
 *   one, and how to read what comes back.
 * @param found - Where each song's album goes.
 */
const searchByName = async (
  web: MusicWeb,
  songs: readonly { at: number; song: PlaylistMissingSong }[],
  search: {
    index: 'release-group' | 'recording';
    atOnce: number;
    clauseOf: (song: PlaylistMissingSong) => string;
    read: (answer: JsonValue | null) => Answer;
  },
  found: (MusicCatalogueHit | null)[],
): Promise<void> => {
  const ask = async (clauses: readonly string[], limit: number) =>
    search.read(
      await web.json(
        `https://musicbrainz.org/ws/2/${search.index}/?query=${encodeURIComponent(clauses.join(' OR '))}&fmt=json&limit=${limit.toString()}`,
      ),
    );

  for (const run of runsOf(songs, search.atOnce)) {
    const answer = await ask(
      run.map(({ song }) => search.clauseOf(song)),
      MOST_HITS,
    );

    for (const { at, song } of run) {
      found[at] = answer.albumOf(song);
    }

    if (answer.count < MOST_HITS || run.length === 1) {
      continue;
    }

    for (const { at, song } of run.filter((each) => found[each.at] === null)) {
      found[at] = (await ask([search.clauseOf(song)], ONE_SONGS_HITS)).albumOf(song);
    }
  }
};

/**
 * The albums songs another service named are on, in MusicBrainz's terms, so they can be asked for —
 * found many to a request, since MusicBrainz answers one request a second and a playlist can name
 * hundreds of songs. A song named on a release, as some services name them, is found by that
 * release, a hundred releases to a search; otherwise by the album it named and its artist; otherwise,
 * where it named no album, by the album the song itself is best known from. Only an exact match is
 * taken — the album's title, give or take what an edition adds, and the artist among those it is
 * credited to — so nothing is asked for that the person did not mean.
 *
 * @param web - The way out to the web, paced as MusicBrainz asks.
 * @param songs - The songs.
 * @returns Each song's album, in the songs' order, or null where none matches or MusicBrainz could
 *   not be asked.
 */
const findAlbumsOfSongs = async (
  web: MusicWeb,
  songs: readonly PlaylistMissingSong[],
): Promise<(MusicCatalogueHit | null)[]> => {
  const found: (MusicCatalogueHit | null)[] = songs.map(() => null);
  const each = songs.map((song, at) => ({ at, song }));
  const onReleases = each.flatMap(({ at, song }) =>
    song.releaseId === null ? [] : [{ at, releaseId: song.releaseId }],
  );

  for (const run of runsOf(onReleases, RELEASES_AT_ONCE)) {
    const read = ReleasesSchema.safeParse(
      await web.json(
        `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(run.map(({ releaseId }) => `reid:${releaseId}`).join(' OR '))}&fmt=json&limit=${MOST_HITS.toString()}`,
      ),
    );
    const releases = new Map(
      (read.success ? read.data.releases : []).flatMap((release) =>
        release === null ? [] : [[release.id, release] as const],
      ),
    );

    for (const { at, releaseId } of run) {
      const release = releases.get(releaseId);

      found[at] =
        release === undefined
          ? null
          : albumHitOf({ ...release['release-group'], 'artist-credit': release['artist-credit'] });
    }
  }

  const left = each.filter(({ at }) => found[at] === null);

  await searchByName(
    web,
    left.filter(({ song }) => song.album !== null),
    {
      index: 'release-group',
      atOnce: ALBUMS_AT_ONCE,
      clauseOf: (song) => clauseFor('releasegroup', baseTitleOf(song.album ?? ''), song.artist),
      read: readAlbums,
    },
    found,
  );
  await searchByName(
    web,
    left.filter(({ song }) => song.album === null),
    {
      index: 'recording',
      atOnce: SONGS_AT_ONCE,
      clauseOf: (song) => clauseFor('recording', song.title, song.artist),
      read: readRecordings,
    },
    found,
  );

  return found;
};

export { findAlbumsOfSongs };
