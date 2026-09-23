import { render, userEvent } from '@testing-library/react-native';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { AnEpisode } from './AnEpisode';
import type { AnEpisodeProps } from './AnEpisode.types';

const THE_PILOT = MediaSummarySchema.parse({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  title: 'Pilot',
  year: null,
  durationSeconds: 2640,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  episodeNumber: 1,
});

const anEpisode = (overrides: Partial<AnEpisodeProps> = {}) =>
  render(
    <AnEpisode
      episode={THE_PILOT}
      watched={0}
      resumeSeconds={null}
      airs=""
      onWatch={jest.fn()}
      onLookAt={jest.fn()}
      {...overrides}
    />,
  );

describe('AnEpisode', () => {
  it('says which episode it is first, since that is what people look for', async () => {
    const drawn = await anEpisode();

    expect(drawn.getByText('1')).toBeTruthy();
  });

  it('says what it is called, how long it runs and when it aired', async () => {
    const drawn = await anEpisode({ airs: 'Aired 11 Jan 2024' });

    expect(drawn.getByText('Pilot')).toBeTruthy();
    expect(drawn.getByText('44:00 · Aired 11 Jan 2024')).toBeTruthy();
  });

  it('plays it in one press, since they have already chosen', async () => {
    const onWatch = jest.fn();
    const drawn = await anEpisode({ onWatch });

    await userEvent.press(drawn.getByLabelText('Play Pilot'));

    expect(onWatch).toHaveBeenCalled();
  });

  it('says how far in somebody is, and offers to carry on from there', async () => {
    const drawn = await anEpisode({ watched: 0.25, resumeSeconds: 660 });

    expect(drawn.getByText('44:00 · 11:00 in')).toBeTruthy();
    expect(drawn.getByLabelText('Resume Pilot from 11:00')).toBeTruthy();
    expect(drawn.getByRole('progressbar', { name: 'How far through Pilot' })).toBeTruthy();
  });

  it('ticks an episode somebody has seen to the end, rather than drawing a full line', async () => {
    const drawn = await anEpisode({ watched: 1 });

    expect(drawn.getByLabelText('Watched')).toBeTruthy();
    expect(drawn.queryByRole('progressbar')).toBeNull();
  });

  it('opens its own page from the button beside it', async () => {
    const onLookAt = jest.fn();
    const drawn = await anEpisode({ onLookAt });

    await userEvent.press(drawn.getByLabelText('About Pilot'));

    expect(onLookAt).toHaveBeenCalled();
  });

  it('manages an episode nobody numbered', async () => {
    const drawn = await anEpisode({ episode: { ...THE_PILOT, episodeNumber: null } });

    expect(drawn.getByText('—')).toBeTruthy();
  });
});
