import { describe, expect, it } from 'vitest';
import { bucketClients } from './bucketClients';

describe('bucketClients', () => {
  it('bands each kind of app that was used and leaves out the rest', () => {
    expect(bucketClients({ browser: 3, desktop: 0, tv: 12, phone: 0 })).toEqual({
      browser: '1-9',
      tv: '10-99',
    });
  });

  it('says nothing when nothing was played', () => {
    expect(bucketClients({ browser: 0, desktop: 0, tv: 0, phone: 0 })).toEqual({});
  });
});
