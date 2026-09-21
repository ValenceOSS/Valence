import { describe, expect, it } from 'vitest';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { MEDIA_REQUEST_KINDS } from '@ValenceContracts/schemas/MediaRequest';

describe('isBookRequest', () => {
  it('is true of a book, and of nothing else', () => {
    expect(MEDIA_REQUEST_KINDS.filter(isBookRequest)).toEqual(['book']);
  });
});
