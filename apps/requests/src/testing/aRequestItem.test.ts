import { describe, expect, it } from 'vitest';
import { aMediaRequest } from './aMediaRequest';
import { aRequestItem } from './aRequestItem';

describe('aRequestItem', () => {
  it('makes a wanted film of the request aMediaRequest makes, with what was changed', () => {
    expect(aRequestItem({ state: 'available' })).toMatchObject({
      requestId: aMediaRequest().id,
      state: 'available',
    });
  });
});
