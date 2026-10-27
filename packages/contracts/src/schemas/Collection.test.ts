import { describe, expect, it } from 'vitest';
import {
  AddCollectionEntriesSchema,
  CollectionSubjectSchema,
  CreateCollectionSchema,
  ReplaceCollectionEntriesSchema,
  UpdateCollectionSchema,
  CollectionReadSchema,
} from './Collection';

describe('Collection', () => {
  it('makes a collection from a name alone', () => {
    expect(CreateCollectionSchema.parse({ name: '  The Trilogy ' })).toEqual({
      name: 'The Trilogy',
    });
  });

  it('refuses a collection with no name', () => {
    expect(CreateCollectionSchema.safeParse({ name: '   ' }).success).toBe(false);
  });

  it('holds a film or a programme, never both in one entry', () => {
    expect(CollectionSubjectSchema.safeParse({ mediaItemId: 'film' }).success).toBe(true);
    expect(CollectionSubjectSchema.safeParse({ seriesId: 'show' }).success).toBe(true);
    expect(
      CollectionSubjectSchema.safeParse({ mediaItemId: 'film', seriesId: 'show' }).success,
    ).toBe(false);
    expect(CollectionSubjectSchema.safeParse({}).success).toBe(false);
  });

  it('adds at least one thing at a time, but may be emptied by a replacement', () => {
    expect(AddCollectionEntriesSchema.safeParse({ entries: [] }).success).toBe(false);
    expect(ReplaceCollectionEntriesSchema.safeParse({ entries: [] }).success).toBe(true);
  });

  it('clears a description with null', () => {
    expect(UpdateCollectionSchema.parse({ description: null })).toEqual({ description: null });
  });

  it('reads a smart collection whose rules this version does not know as smart with no rules', () => {
    const read = CollectionReadSchema.parse({
      id: '00000000-0000-4000-8000-00000000c011',
      name: 'From the future',
      description: null,
      isOrdered: true,
      hasOwnArtwork: false,
      entryCount: 1,
      coverMediaIds: [],
      isSmart: true,
      rules: { holds: 'films', rules: [], order: 'byMoonPhase', limit: null },
      updatedAt: '',
    });

    expect(read).toMatchObject({ isSmart: true, rules: null, holds: ['film', 'series'] });
  });
});
