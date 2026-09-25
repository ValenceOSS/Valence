import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { theArtworkFor } from './theArtworkFor';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const aTitle = (overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  title: 'Arrival',
  year: 2016,
  durationSeconds: 6960,
  width: 3840,
  height: 2160,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
  ...overrides,
});

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://192.168.1.36:8420' }));
});

afterEach(() => {
  forgetPlatform();
});

describe('theArtworkFor', () => {
  it('gives the whole address, since the system fetches the image itself', () => {
    expect(theArtworkFor(aTitle())).toBe(
      'http://192.168.1.36:8420/api/media/3fa85f64-5717-4562-b3fc-2c963f66afa6/image/poster',
    );
  });

  it('says nothing for a title with no artwork, rather than an address that will not answer', () => {
    expect(theArtworkFor(aTitle({ hasPoster: false }))).toBeNull();
  });
});
