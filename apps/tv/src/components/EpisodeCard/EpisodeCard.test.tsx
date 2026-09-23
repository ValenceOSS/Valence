import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { EpisodeCard } from '@ValenceTv/components/EpisodeCard/EpisodeCard';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const EPISODE: MediaSummary = {
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '00000000-0000-4000-8000-000000000002',
  title: 'System',
  year: 2022,
  durationSeconds: 2700,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  seriesTitle: 'The Bear',
  seasonNumber: 1,
  episodeNumber: 3,
};

describe('EpisodeCard', () => {
  it('opens the episode it shows', async () => {
    const onPress = jest.fn();
    const drawn = await render(<EpisodeCard episode={EPISODE} onPress={onPress} />);

    await userEvent.press(drawn.getByRole('button', { name: 'System' }));

    expect(onPress).toHaveBeenCalledWith(EPISODE);
  });

  it('gives its number, its name and how long it runs', async () => {
    const drawn = await render(<EpisodeCard episode={EPISODE} onPress={jest.fn()} />);

    expect(drawn.getByText('3. System')).toBeTruthy();
    expect(drawn.getByText('45:00')).toBeTruthy();
  });

  it('gives only its name where it has no number', async () => {
    const drawn = await render(
      <EpisodeCard episode={{ ...EPISODE, episodeNumber: null }} onPress={jest.fn()} />,
    );

    expect(drawn.getByText('System')).toBeTruthy();
  });

  it('says what happens in it where the catalogue says', async () => {
    const drawn = await render(
      <EpisodeCard episode={EPISODE} overview="Carmy takes over the shop." onPress={jest.fn()} />,
    );

    expect(drawn.getByText('Carmy takes over the shop.')).toBeTruthy();
  });

  it('says it has been watched once it has', async () => {
    const drawn = await render(<EpisodeCard episode={EPISODE} isWatched onPress={jest.fn()} />);

    expect(drawn.getByText('45:00   ·   Watched')).toBeTruthy();
  });

  it('lights its name while the remote is on it', async () => {
    const drawn = await render(<EpisodeCard episode={EPISODE} onPress={jest.fn()} />);

    expect(drawn.getByText('3. System')).toHaveStyle({ color: tokens.colours.muted });

    await fireEvent(drawn.getByRole('button', { name: 'System' }), 'focus');

    expect(drawn.getByText('3. System')).toHaveStyle({ color: tokens.colours.text });
  });
});
