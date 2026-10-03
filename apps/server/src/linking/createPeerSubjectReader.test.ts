import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { book, library, mediaItem, musicAlbum, musicArtist, musicTrack } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createPeerSubjectReader } from './createPeerSubjectReader';

const STARTING_THE_DATABASE_MS = 60_000;

describe('createPeerSubjectReader', () => {
  it(
    'reads a title, book, album or artist’s library and age, and whether anything certificates it',
    async () => {
      const db = await aMigratedDatabase();

      await db.insert(library).values([
        { id: 'films', name: 'Films', kind: 'movies', path: '/films' },
        { id: 'music', name: 'Music', kind: 'music', path: '/music' },
        { id: 'books', name: 'Books', kind: 'books', path: '/books' },
      ]);
      await db
        .insert(mediaItem)
        .values([
          { ...aMediaItemRow('arrival', 'films'), certificationAge: 12 },
          aMediaItemRow('song', 'music'),
        ]);
      await db.insert(musicArtist).values({
        id: 'artist',
        libraryId: 'music',
        name: 'Artist',
        nameKey: 'artist',
        sortName: 'Artist',
      });
      await db.insert(musicAlbum).values({
        id: 'album',
        libraryId: 'music',
        artistId: 'artist',
        title: 'Album',
        titleKey: 'album',
      });
      await db.insert(musicTrack).values({ mediaItemId: 'song', albumId: 'album', codec: 'flac' });
      await db.insert(book).values({
        id: 'dune',
        libraryId: 'books',
        title: 'Dune',
        path: '/books/dune.epub',
        layout: 'reflow',
        direction: 'leftToRight',
      });

      const read = createPeerSubjectReader(db);

      expect(await read({ kind: 'item', id: 'arrival' })).toEqual({
        id: 'arrival',
        title: 'arrival',
        libraryId: 'films',
        certificationAge: 12,
        isNeverRated: false,
      });
      expect((await read({ kind: 'item', id: 'song' }))?.isNeverRated).toBe(true);
      expect(await read({ kind: 'book', id: 'dune' })).toEqual({
        id: 'dune',
        title: 'Dune',
        libraryId: 'books',
        certificationAge: null,
        isNeverRated: true,
      });
      expect((await read({ kind: 'album', id: 'album' }))?.libraryId).toBe('music');
      expect((await read({ kind: 'artist', id: 'artist' }))?.title).toBe('Artist');
      expect(await read({ kind: 'item', id: 'nothing' })).toBeNull();
      expect(await read({ kind: 'book', id: 'nothing' })).toBeNull();
    },
    STARTING_THE_DATABASE_MS,
  );
});
