import { and, asc, desc, eq, exists, gte, lte, not, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { nullsLast } from '@ValenceDatabase/nullsLast';
import { qualified } from '@ValenceDatabase/qualified';
import { truth } from '@ValenceDatabase/truth';
import {
  favouriteArtist,
  library,
  mediaItem,
  musicAlbum,
  musicPlay,
  musicTrack,
} from '#dialect/Schema';
import { MOST_SMART_ENTRIES } from '@ValenceContracts/schemas/SmartRules';
import { isByAFollowedArtist } from '@ValenceServer/music/isByAFollowedArtist';
import { isLikedBy } from '@ValenceServer/music/isLikedBy';
import { trackVisibleTo } from '@ValenceServer/music/trackVisibleTo';
import { daysBefore } from './daysBefore';
import { hasAnyGenre } from './hasAnyGenre';
import { shuffledBy } from './shuffledBy';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { SongOrder, SongRule, SongRules } from '@ValenceContracts/schemas/SmartRules';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type SmartSong = {
  id: string;
  albumId: string;
  albumHasArtwork: boolean;
  durationSeconds: number;
  addedAt: Date;
};

type SongsAsked = {
  listId: string;
  viewer: Viewer;
  profileId: string | null;
  rules: SongRules;
  now: Date;
};

/**
 * The songs a smart playlist holds: every song the viewer may hear that keeps all of its rules, in
 * its order and up to its limit, with what a rule asks of somebody asked of the profile given.
 *
 * @param db - The database.
 * @param asked - The playlist, who is looking, whose listening the rules read and when it is.
 * @returns The songs, in order.
 */
const songsMatching = async (
  db: AnyValenceDatabase,
  { listId, viewer, profileId, rules, now }: SongsAsked,
): Promise<SmartSong[]> => {
  const theirs = profileId ?? '';

  const plays = sql<number>`(select count(*) from ${musicPlay} where ${qualified(musicPlay.trackId)} = ${qualified(mediaItem.id)} and ${qualified(musicPlay.profileId)} = ${theirs})`;

  const lastPlayed = sql<Date | null>`(select max(${qualified(musicPlay.playedAt)}) from ${musicPlay} where ${qualified(musicPlay.trackId)} = ${qualified(mediaItem.id)} and ${qualified(musicPlay.profileId)} = ${theirs})`;

  const isLiked = isLikedBy(db, theirs);

  const isByAFollowedArtistOrAlbum =
    or(
      isByAFollowedArtist(db, theirs),
      exists(
        db
          .select({ one: sql`1` })
          .from(favouriteArtist)
          .where(
            and(
              eq(favouriteArtist.artistId, musicAlbum.artistId),
              eq(favouriteArtist.profileId, theirs),
            ),
          ),
      ),
    ) ?? sql`false`;

  const playedSince = (since: Date): SQL =>
    exists(
      db
        .select({ one: sql`1` })
        .from(musicPlay)
        .where(
          and(
            eq(musicPlay.trackId, mediaItem.id),
            eq(musicPlay.profileId, theirs),
            gte(musicPlay.playedAt, since),
          ),
        ),
    );

  const conditionOf = (rule: SongRule): SQL | undefined => {
    switch (rule.kind) {
      case 'liked':
        return rule.is ? isLiked : not(isLiked);
      case 'followedArtist':
        return rule.is ? isByAFollowedArtistOrAlbum : not(isByAFollowedArtistOrAlbum);
      case 'genre':
        return hasAnyGenre(musicAlbum.genres, rule.anyOf, rule.isNegated);
      case 'released':
        return and(
          rule.from === null ? undefined : gte(musicAlbum.year, rule.from),
          rule.to === null ? undefined : lte(musicAlbum.year, rule.to),
        );
      case 'plays':
        return and(
          rule.atLeast === null ? undefined : gte(plays, rule.atLeast),
          rule.atMost === null ? undefined : lte(plays, rule.atMost),
        );
      case 'lastPlayed': {
        const recently = playedSince(daysBefore(now, rule.withinDays));

        return rule.isNegated ? not(recently) : recently;
      }
      case 'added':
        return gte(mediaItem.addedAt, daysBefore(now, rule.withinDays));
    }
  };

  const inAlbumOrder = [
    asc(sql`coalesce(${musicTrack.discNumber}, 1)`),
    asc(sql`coalesce(${musicTrack.trackNumber}, 9999)`),
  ];

  const orderOf = (order: SongOrder): SQL[] => {
    switch (order) {
      case 'random':
        return [asc(shuffledBy(mediaItem.id, listId, now))];
      case 'mostPlayed':
        return [desc(plays), nullsLast(lastPlayed, 'desc'), asc(mediaItem.title)];
      case 'lastPlayed':
        return [nullsLast(lastPlayed, 'desc'), asc(mediaItem.title)];
      case 'added':
        return [desc(mediaItem.addedAt), asc(musicAlbum.title), ...inAlbumOrder];
      case 'released':
        return [nullsLast(musicAlbum.year, 'desc'), asc(musicAlbum.title), ...inAlbumOrder];
      case 'title':
        return [asc(mediaItem.title)];
    }
  };

  return db
    .select({
      id: mediaItem.id,
      albumId: musicAlbum.id,
      albumHasArtwork: truth(sql`${musicAlbum.artworkPath} is not null`),
      durationSeconds: mediaItem.durationSeconds,
      addedAt: mediaItem.addedAt,
    })
    .from(musicTrack)
    .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId))
    .innerJoin(musicAlbum, eq(musicAlbum.id, musicTrack.albumId))
    .innerJoin(library, eq(library.id, mediaItem.libraryId))
    .where(and(trackVisibleTo(db, viewer), ...rules.rules.map(conditionOf)))
    .orderBy(...orderOf(rules.order), asc(mediaItem.id))
    .limit(rules.limit ?? MOST_SMART_ENTRIES);
};

export type { SmartSong, SongsAsked };

export { songsMatching };
