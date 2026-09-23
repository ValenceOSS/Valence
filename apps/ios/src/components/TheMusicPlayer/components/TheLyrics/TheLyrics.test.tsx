import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchLyrics } from '@ValenceClient/music/fetchMusic';
import { TheLyrics } from './TheLyrics';

jest.mock('@ValenceClient/music/fetchMusic', () => ({
  ...jest.requireActual<object>('@ValenceClient/music/fetchMusic'),
  fetchLyrics: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheLyrics', () => {
  it('shows the words, and plays from a timed line when pressed', async () => {
    jest.mocked(fetchLyrics).mockResolvedValue({
      isSynced: true,
      lines: [
        { atMs: 1000, text: 'It’s so cold in this house' },
        { atMs: 5000, text: 'Open mouth swallowing us' },
      ],
    });
    const onSeek = jest.fn();
    const drawn = await render(<TheLyrics trackId="one" atSeconds={2} onSeek={onSeek} />, {
      wrapper: CacheScope,
    });

    await userEvent.press(
      await drawn.findByRole('button', { name: 'Play from “Open mouth swallowing us”' }),
    );

    expect(onSeek).toHaveBeenCalledWith(5);
  });

  it('says so where a song has no words', async () => {
    jest.mocked(fetchLyrics).mockResolvedValue({ isSynced: false, lines: [] });
    const drawn = await render(<TheLyrics trackId="one" atSeconds={0} onSeek={jest.fn()} />, {
      wrapper: CacheScope,
    });

    expect(await drawn.findByText('There are no words for this one.')).toBeTruthy();
  });
});
