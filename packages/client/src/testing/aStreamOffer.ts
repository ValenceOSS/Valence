import type { StreamOffer } from '@ValenceContracts/schemas/StreamOffer';

/**
 * A stream a source offers, ready to play at 1080p, for a test to change the parts it cares about.
 *
 * @param overrides - Anything a test wants different.
 * @returns The offer.
 */
const aStreamOffer = (overrides: Partial<StreamOffer> = {}): StreamOffer => ({
  id: 'offer-1',
  sourceName: 'Example files',
  name: 'Film.1999.1080p.BluRay.x264',
  fileName: null,
  sizeBytes: 8_000_000_000,
  isReady: true,
  seeders: 20,
  resolution: '1080p',
  source: 'bluray',
  codec: 'h264',
  hdr: [],
  audio: [],
  languages: [],
  group: null,
  ...overrides,
});

export { aStreamOffer };
