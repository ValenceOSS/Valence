import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { APoster } from './APoster';
import { STILL_WIDTH } from './STILL_WIDTH';
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

  it('says how many episodes are left, and nothing for none', async () => {
    const drawn = await render(<APoster {...asDrawn(aTitle())} count={3} />);

    expect(drawn.getByLabelText('3 episodes left')).toBeTruthy();
    expect(drawn.getByText('3')).toBeTruthy();

    const none = await render(<APoster {...asDrawn(aTitle())} count={0} />);

    expect(none.queryByLabelText(/left/)).toBeNull();
  });

  it('ticks what has been watched through', async () => {
    const drawn = await render(<APoster {...asDrawn(aTitle())} watched={1} />);

    expect(drawn.getByLabelText('Watched')).toBeTruthy();
  });

  it('says what year it is from', async () => {
    const drawn = await render(<APoster {...asDrawn(aTitle())} />);

    expect(drawn.getByText('2016')).toBeTruthy();
  });

  it('says nothing about a year nobody knows', async () => {
    const drawn = await render(<APoster {...asDrawn(aTitle({ year: null }))} />);

    expect(drawn.queryByText('2016')).toBeNull();
  });

  it('says where it stands, where it was told', async () => {
    const drawn = await render(<APoster {...asDrawn(aTitle())} note="Requested" />);

    expect(drawn.getByText('Requested')).toBeTruthy();
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

  it('fills the width it is given, as a cell of a grid does', async () => {
    const drawn = await render(<APoster {...asDrawn(aTitle())} wide={150} />);
    const whole = drawn.toJSON();

    expect(
      whole !== null && !Array.isArray(whole) && StyleSheet.flatten(whole.props.style),
    ).toMatchObject({ width: 150 });
  });

  it('lies flat as a still, wider than a poster stands', async () => {
    const drawn = await render(<APoster {...asDrawn(aTitle())} isStill />);
    const whole = drawn.toJSON();

    expect(
      whole !== null && !Array.isArray(whole) && StyleSheet.flatten(whole.props.style),
    ).toMatchObject({ width: STILL_WIDTH });
  });

  it('says a line beneath its name, where it was given one', async () => {
    const drawn = await render(
      <APoster {...asDrawn(aTitle())} year={null} detail="S1 · E2  Pilot" />,
    );

    expect(drawn.getByText('S1 · E2  Pilot')).toBeTruthy();
  });
});
