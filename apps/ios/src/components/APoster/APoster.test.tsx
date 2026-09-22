import { render } from '@testing-library/react-native';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { APoster } from './APoster';
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
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

afterEach(() => {
  forgetPlatform();
});

const asDrawn = (media: MediaSummary) => ({
  title: media.title,
  year: media.year,
  artwork: theArtworkFor(media),
});

describe('APoster', () => {
  it('names the title', async () => {
    const drawn = await render(<APoster {...asDrawn(aTitle())} />);

    expect(drawn.getAllByText('Arrival').length).toBeGreaterThan(0);
  });

  it('says what year it is from', async () => {
    const drawn = await render(<APoster {...asDrawn(aTitle())} />);

    expect(drawn.getByText('2016')).toBeTruthy();
  });

  it('says nothing about a year nobody knows', async () => {
    const drawn = await render(<APoster {...asDrawn(aTitle({ year: null }))} />);

    expect(drawn.queryByText('2016')).toBeNull();
  });

  it('stands the name in where there is no artwork', async () => {
    const drawn = await render(<APoster {...asDrawn(aTitle({ hasPoster: false }))} />);

    expect(drawn.getAllByText('Arrival').length).toBe(2);
  });

  it('draws nothing across the foot of something nobody has started', async () => {
    const drawn = await render(<APoster {...asDrawn(aTitle())} />);

    expect(drawn.queryByRole('progressbar')).toBeNull();
  });

  it('says how far through it somebody is, rather than only drawing it', async () => {
    const drawn = await render(<APoster {...asDrawn(aTitle())} watched={0.6} />);

    expect(
      drawn.getByRole('progressbar', { name: 'How far through Arrival', value: { now: 60 } }),
    ).toBeTruthy();
  });
});
