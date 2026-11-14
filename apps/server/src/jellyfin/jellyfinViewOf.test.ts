import { describe, expect, it } from 'vitest';
import { LibrarySchema } from '@ValenceContracts/schemas/Library';
import { jellyfinViewOf } from './jellyfinViewOf';

const library = (kind: 'movies' | 'anime') =>
  LibrarySchema.parse({
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    name: 'Films',
    kind,
    path: '/media/films',
    itemCount: 4,
    lastScannedAt: null,
    defaultAudioLanguage: null,
    filesAtOnce: null,
  });

describe('jellyfinViewOf', () => {
  it('describes a film library as a view of films', () => {
    expect(jellyfinViewOf(library('movies'), 'server')).toMatchObject({
      Id: '7c9e6679742540de944be07fc1f90ae7',
      Name: 'Films',
      Type: 'CollectionFolder',
      CollectionType: 'movies',
      ChildCount: 4,
    });
  });

  it('describes any other video library as a view of programmes', () => {
    expect(jellyfinViewOf(library('anime'), 'server').CollectionType).toBe('tvshows');
  });
});
