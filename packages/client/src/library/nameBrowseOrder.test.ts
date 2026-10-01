import { describe, expect, it } from 'vitest';
import { BrowseOrderSchema } from '@ValenceClient/library/BrowseOrder';
import { nameBrowseOrder } from './nameBrowseOrder';

describe('nameBrowseOrder', () => {
  it('names every order', () => {
    expect(BrowseOrderSchema.options.map(nameBrowseOrder)).toEqual([
      'Recently added',
      'Release date',
      'Title',
      'Rating',
      'Size',
    ]);
  });
});
