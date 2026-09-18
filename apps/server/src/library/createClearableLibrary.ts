import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import {
  library,
  mediaItem,
  mediaPreviewOverride,
  mediaSegment,
  musicAlbum,
  musicArtist,
  musicTrack,
} from '@ValenceServer/db/Schema';
import { AudioStreamSchema } from '@ValenceContracts/schemas/MediaItem';
import {
  DETECT_SEGMENTS_JOB,
  REGENERATE_PREVIEWS_JOB,
  REGENERATE_TRICKPLAY_JOB,
} from '@ValenceServer/jobs/JobQueue';
import { clearJobCompletions } from './createMediaStore';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { ClearableLibrary } from './clearLibraryParts';

/**
 * The addresses a part pointed at, each once, leaving out the items that pointed at nothing.
 *
 * @param held - What each item held.
 * @returns The distinct addresses.
 */
const distinct = (held: (string | null)[]): string[] => [
  ...new Set(held.filter((where) => where !== null)),
];

/**
 * The database side of clearing parts of a library: emptying the columns each part is kept in, and
 * handing back the pictures and files those columns pointed at so their copies can go too.
 *
 * Each part is emptied with one statement across the library rather than item by item. Emptying a
 * part that is looked up on the web also forgets that it was looked up, since otherwise the lookup
 * would think it had already asked. Nothing an operator chose is touched: corrections and preview
 * moments live in tables of their own.
 *
 * @param db - The database.
 * @returns The library's parts, as the clearing work reaches them.
 */
const createClearableLibrary = (db: ValenceDatabase): ClearableLibrary => {
  const inLibrary = (libraryId: string) => eq(mediaItem.libraryId, libraryId);

  const itemsIn = (libraryId: string) =>
    db.select({ id: mediaItem.id }).from(mediaItem).where(inLibrary(libraryId));

  return {
    empty: async (libraryId, part) => {
      switch (part) {
        case 'descriptions':
          await db
            .update(mediaItem)
            .set({ overview: null, tagline: null, genres: null, rating: null })
            .where(inLibrary(libraryId));

          return [];

        case 'cast':
          await db.update(mediaItem).set({ castMembers: null }).where(inLibrary(libraryId));

          return [];

        case 'ageRatings':
          await db
            .update(mediaItem)
            .set({ certifications: null, certificationAge: null })
            .where(inLibrary(libraryId));

          return [];

        case 'trailers':
          await db.update(mediaItem).set({ trailerKey: null }).where(inLibrary(libraryId));

          return [];

        case 'artwork': {
          const held = await db
            .select({ poster: mediaItem.posterUrl, backdrop: mediaItem.backdropUrl })
            .from(mediaItem)
            .where(inLibrary(libraryId));

          await db
            .update(mediaItem)
            .set({ posterUrl: null, backdropUrl: null })
            .where(inLibrary(libraryId));

          return distinct(held.flatMap((row) => [row.poster, row.backdrop]));
        }

        case 'logos': {
          const held = await db
            .select({ logo: mediaItem.logoUrl })
            .from(mediaItem)
            .where(inLibrary(libraryId));

          await db.update(mediaItem).set({ logoUrl: null }).where(inLibrary(libraryId));

          return distinct(held.map((row) => row.logo));
        }

        case 'intros':
          await db
            .delete(mediaSegment)
            .where(inArray(mediaSegment.mediaItemId, itemsIn(libraryId)));
          await clearJobCompletions(db, libraryId, DETECT_SEGMENTS_JOB);

          return [];

        case 'albumCovers': {
          const held = await db
            .select({ path: musicAlbum.artworkPath })
            .from(musicAlbum)
            .where(eq(musicAlbum.libraryId, libraryId));

          await db
            .update(musicAlbum)
            .set({ artworkPath: null, lookedUpAt: null })
            .where(eq(musicAlbum.libraryId, libraryId));

          return distinct(held.map((row) => row.path));
        }

        case 'artistPictures': {
          const held = await db
            .select({ path: musicArtist.imagePath })
            .from(musicArtist)
            .where(eq(musicArtist.libraryId, libraryId));

          await db
            .update(musicArtist)
            .set({ imagePath: null, lookedUpAt: null })
            .where(eq(musicArtist.libraryId, libraryId));

          return distinct(held.map((row) => row.path));
        }

        case 'lyrics':
          await db
            .update(musicTrack)
            .set({
              lyrics: null,
              lyricsAreSynced: false,
              lyricsModifiedAtMs: null,
              lyricsLookedUpAt: null,
            })
            .where(inArray(musicTrack.mediaItemId, itemsIn(libraryId)));

          return [];

        case 'musicVideos':
          await db
            .update(musicTrack)
            .set({ videoKey: null })
            .where(inArray(musicTrack.mediaItemId, itemsIn(libraryId)));
          await db
            .update(musicArtist)
            .set({ lookedUpAt: null })
            .where(eq(musicArtist.libraryId, libraryId));

          return [];
      }
    },

    listMade: async (libraryId) => {
      const rows = await db
        .select({
          path: mediaItem.path,
          audioStreams: mediaItem.audioStreams,
          generation: library.generation,
          defaultAudioLanguage: library.defaultAudioLanguage,
          atSeconds: mediaPreviewOverride.atSeconds,
          clipSeconds: mediaPreviewOverride.durationSeconds,
        })
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .leftJoin(
          mediaPreviewOverride,
          and(
            eq(mediaPreviewOverride.libraryId, mediaItem.libraryId),
            eq(mediaPreviewOverride.path, mediaItem.path),
          ),
        )
        .where(inLibrary(libraryId));

      return rows.map((row) => ({
        path: row.path,
        audioStreams: z.array(AudioStreamSchema).parse(row.audioStreams),
        generation: row.generation,
        defaultAudioLanguage: row.defaultAudioLanguage,
        previewMoment:
          row.atSeconds === null
            ? null
            : { atSeconds: row.atSeconds, durationSeconds: row.clipSeconds },
      }));
    },

    forgetMade: (libraryId, part) =>
      clearJobCompletions(
        db,
        libraryId,
        part === 'previews' ? REGENERATE_PREVIEWS_JOB : REGENERATE_TRICKPLAY_JOB,
      ),
  };
};

export { createClearableLibrary };
