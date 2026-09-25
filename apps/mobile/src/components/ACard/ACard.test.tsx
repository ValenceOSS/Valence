import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { ACard } from './ACard';

const anEpisode = MediaSummarySchema.parse({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa1',
  libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  title: 'Good News About Hell',
  year: 2022,
  durationSeconds: 3300,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  seriesId: 'severance',
  seriesTitle: 'Severance',
  seasonNumber: 1,
  episodeNumber: 4,
});

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('ACard', () => {
  it('opens the episode itself, where it is shown as one', async () => {
    const onLookAt = jest.fn();
    const drawn = await render(
      <ACard media={anEpisode} asProgramme={false} onLookAt={onLookAt} onLookAtShow={jest.fn()} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Good News About Hell' }));

    expect(onLookAt).toHaveBeenCalledWith(anEpisode.id);
  });

  it('opens its programme, named as the programme, where it stands for one', async () => {
    const onLookAtShow = jest.fn();
    const drawn = await render(
      <ACard media={anEpisode} asProgramme onLookAt={jest.fn()} onLookAtShow={onLookAtShow} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Severance' }));

    expect(onLookAtShow).toHaveBeenCalledWith(anEpisode.libraryId, expect.any(String));
  });

  it('names an episode drawn as a still for its programme, and says which episode it is', async () => {
    const onLookAt = jest.fn();
    const drawn = await render(
      <ACard
        media={anEpisode}
        asProgramme={false}
        isStill
        onLookAt={onLookAt}
        onLookAtShow={jest.fn()}
      />,
    );

    expect(drawn.getAllByText('Severance').length).toBeGreaterThan(0);
    expect(drawn.getByText('S1 · E4  Good News About Hell')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Severance, Good News About Hell' }));

    expect(onLookAt).toHaveBeenCalledWith(anEpisode.id);
  });
});
