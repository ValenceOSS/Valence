import { asc } from 'drizzle-orm';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { createDatabase } from '#dialect/createDatabase';
import { library, mediaItem } from '#dialect/Schema';
import type { SQL } from 'drizzle-orm';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const NOWHERE = 'postgres://nobody@localhost:1/none';

const ITEM_COLUMNS =
  '"id", "libraryId", "seriesId", "certificationAge", "path", "title", "sizeBytes", "modifiedAtMs", "container", "durationSeconds", "videoCodec", "videoRange", "width", "height", "audioStreams", "subtitleStreams"';

const anItem = (id: string, libraryId: string, seriesId: string | null, age: number | null) =>
  `('${id}', '${libraryId}', ${seriesId === null ? 'NULL' : `'${seriesId}'`}, ${age === null ? 'NULL' : String(age)}, '/${id}', '${id}', 1, 1, 'mkv', 1, 'h264', 'SDR', 1, 1, '[]', '[]')`;

const SEED = `
  INSERT INTO "user" ("id", "name", "email") VALUES
    ('kid', 'Kid', 'kid@example.com'),
    ('teen', 'Teen', 'teen@example.com'),
    ('admin', 'Admin', 'admin@example.com');
  INSERT INTO "viewer_profile" ("id", "userId", "name", "colour") VALUES ('kid-face', 'kid', 'Kid', 'red');
  INSERT INTO "library" ("id", "name", "kind", "path") VALUES
    ('films', 'Films', 'movies', '/films'),
    ('kids', 'Kids', 'movies', '/kids'),
    ('music', 'Music', 'music', '/music'),
    ('locked', 'Locked', 'movies', '/locked');
  INSERT INTO "series" ("id", "libraryId", "key", "title") VALUES ('show', 'films', 'show', 'Show');
  INSERT INTO "media_item" (${ITEM_COLUMNS}) VALUES
    ${[
      anItem('film-12', 'films', null, 12),
      anItem('film-18', 'films', null, 18),
      anItem('film-unrated', 'films', null, null),
      anItem('episode-15', 'films', 'show', 15),
      anItem('cartoon', 'kids', null, null),
      anItem('song', 'music', null, null),
      anItem('locked-film', 'locked', null, 0),
    ].join(',\n    ')};
  INSERT INTO "music_artist" ("id", "libraryId", "name", "nameKey", "sortName") VALUES ('artist', 'music', 'Artist', 'artist', 'Artist');
  INSERT INTO "music_album" ("id", "libraryId", "artistId", "title", "titleKey") VALUES ('album', 'music', 'artist', 'Album', 'album');
  INSERT INTO "music_track" ("mediaItemId", "albumId", "codec") VALUES ('song', 'album', 'flac');
  INSERT INTO "library_block" ("userId", "libraryId") VALUES ('kid', 'locked');
  INSERT INTO "age_ceiling" ("userId", "libraryId", "maximumAge", "allowsUnrated") VALUES
    ('kid', 'films', 12, false),
    ('kid', 'music', 12, false),
    ('teen', 'films', 15, true);
  INSERT INTO "age_exception" ("id", "userId", "mediaItemId", "seriesId", "effect") VALUES
    ('allow-show', 'kid', NULL, 'show', 'allow'),
    ('deny-film', 'kid', 'film-12', NULL, 'deny');
  INSERT INTO "hidden" ("id", "profileId", "mediaItemId", "seriesId", "libraryId") VALUES
    ('hide-film', 'kid-face', 'film-unrated', NULL, NULL),
    ('hide-show', 'kid-face', NULL, 'show', NULL),
    ('hide-music', 'kid-face', NULL, NULL, 'music');
`;

/**
 * A database of films, a programme, a children's library, a song and a library one account is kept
 * out of, with the ceilings, exceptions and hidden things that tell the visibility conditions apart:
 * a child who may not see much, a teenager allowed unrated things, and an administrator. Each
 * condition is built as the server builds it and run here, so a test reads which rows it kept.
 *
 * @returns Who can be asked about, and what to read items and libraries through.
 */
const aVisibilityPlayground = async () => {
  const db = await aMigratedDatabase();
  const { db: builder } = createDatabase(NOWHERE);

  await db.$client.exec(SEED);

  const viewers = {
    kid: { kind: 'account', accountId: 'kid', profileId: 'kid-face', isAdministrator: false },
    kidWithoutProfiles: {
      kind: 'account',
      accountId: 'kid',
      profileId: null,
      isAdministrator: false,
    },
    teen: { kind: 'account', accountId: 'teen', profileId: null, isAdministrator: false },
    admin: { kind: 'account', accountId: 'admin', profileId: null, isAdministrator: true },
    adminWatchingAsKid: {
      kind: 'account',
      accountId: 'kid',
      profileId: 'kid-face',
      isAdministrator: true,
    },
    guest: { kind: 'guest', shareId: 'share' },
    server: { kind: 'server' },
  } satisfies Record<string, Viewer>;

  return {
    viewers,
    itemsKeptBy: async (build: (db: AnyValenceDatabase) => SQL | undefined) =>
      (
        await db
          .select({ id: mediaItem.id })
          .from(mediaItem)
          .where(build(builder))
          .orderBy(asc(mediaItem.id))
      ).map((row) => row.id),
    librariesKeptBy: async (build: (db: AnyValenceDatabase) => SQL | undefined) =>
      (
        await db
          .select({ id: library.id })
          .from(library)
          .where(build(builder))
          .orderBy(asc(library.id))
      ).map((row) => row.id),
  };
};

export { aVisibilityPlayground };
