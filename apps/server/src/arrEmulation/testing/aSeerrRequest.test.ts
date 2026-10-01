import { describe, expect, it } from 'vitest';
import { MediaRequestSchema } from '@ValenceContracts/schemas/MediaRequest';
import { aSeerrRequest } from './aSeerrRequest';

describe('aSeerrRequest', () => {
  it('is a request the requests service could have answered with', () => {
    expect(MediaRequestSchema.parse(aSeerrRequest())).toEqual(aSeerrRequest());
  });

  it('takes what is different about it', () => {
    expect(aSeerrRequest({ state: 'available' }).state).toBe('available');
  });
});
