import { describe, expect, it } from 'vitest';
import { aStreamOffer } from '@ValenceClient/testing/aStreamOffer';
import { describeStreamOffer } from './describeStreamOffer';

describe('describeStreamOffer', () => {
  it('says a stream’s picture, range, sound, size and whether it starts straight away', () => {
    expect(
      describeStreamOffer(
        aStreamOffer({
          resolution: '2160p',
          hdr: ['dolbyVision', 'hdr10'],
          audio: ['dts', 'atmos'],
          sizeBytes: 18_000_000_000,
        }),
      ).summary,
    ).toBe('4K · Dolby Vision · Dolby Atmos · 17 GB · Instant');
  });

  it('leaves out what a stream does not say, and says one has to download first', () => {
    expect(
      describeStreamOffer(aStreamOffer({ resolution: null, sizeBytes: null, isReady: false }))
        .summary,
    ).toBe('Downloads first');
  });

  it('says where a stream comes from and what its file is called', () => {
    expect(describeStreamOffer(aStreamOffer({ fileName: 'film.mkv' })).detail).toBe(
      'Example files · film.mkv',
    );
    expect(describeStreamOffer(aStreamOffer()).detail).toBe(
      'Example files · Film.1999.1080p.BluRay.x264',
    );
  });
});
