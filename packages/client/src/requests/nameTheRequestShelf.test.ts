import { describe, expect, it } from 'vitest';
import { REQUEST_SHELVES } from './shelfOfRequest';
import { nameTheRequestShelf } from './nameTheRequestShelf';

describe('nameTheRequestShelf', () => {
  it('heads each part of the requests list by what its requests need next', () => {
    expect(REQUEST_SHELVES.map(nameTheRequestShelf)).toEqual([
      'Waiting for approval',
      'In progress',
      'Not out yet',
      'Missing',
      'In the library',
      'Declined',
    ]);
  });
});
