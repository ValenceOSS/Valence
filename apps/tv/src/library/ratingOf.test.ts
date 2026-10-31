import { ratingOf } from '@ValenceTv/library/ratingOf';

describe('ratingOf', () => {
  it('pairs a certificate with the country whose board issued it', () => {
    expect(ratingOf({ certification: '12A', certificationRegion: 'GB' })).toEqual({
      certification: '12A',
      region: 'GB',
    });
  });

  it('has none where either is missing', () => {
    expect(ratingOf({ certification: '12A', certificationRegion: null })).toBeNull();
    expect(ratingOf({ certification: '', certificationRegion: 'GB' })).toBeNull();
    expect(ratingOf({})).toBeNull();
  });
});
