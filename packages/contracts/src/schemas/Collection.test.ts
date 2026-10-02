import { describe, expect, it } from 'vitest';
import {
  AddCollectionEntriesSchema,
  CollectionSubjectSchema,
  CreateCollectionSchema,
  ReplaceCollectionEntriesSchema,
  UpdateCollectionSchema,
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
});
