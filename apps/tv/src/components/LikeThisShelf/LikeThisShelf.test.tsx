import { render, userEvent } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { useLikeThis } from '@ValenceClient/library/useLikeThis';
import { LikeThisShelf } from './LikeThisShelf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

jest.mock('@ValenceClient/library/useLikeThis', () => ({ useLikeThis: jest.fn() }));

const CONTACT: MediaSummary = {
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: 'Contact',
  year: 1997,
  durationSeconds: 9000,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-09-23T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
};

const NO_PROGRESS: ReadonlyMap<string, WatchProgress> = new Map();

beforeEach(() => {
  jest.mocked(useLikeThis).mockReset().mockReturnValue([CONTACT]);
});

describe('LikeThisShelf', () => {
  it('names the row, and opens a title from it', async () => {
    const onOpen = jest.fn();
    const drawn = await render(
      <LikeThisShelf mediaId="arrival" progress={NO_PROGRESS} onOpen={onOpen} />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('More like this')).toBeOnTheScreen();

    await userEvent.press(drawn.getByRole('button', { name: 'Contact' }));

    expect(onOpen).toHaveBeenCalledWith(CONTACT);
    expect(useLikeThis).toHaveBeenCalledWith('arrival');
  });

  it('draws nothing where nothing is alike', async () => {
    jest.mocked(useLikeThis).mockReturnValue([]);

    const drawn = await render(
      <LikeThisShelf mediaId="arrival" progress={NO_PROGRESS} onOpen={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(drawn.queryByText('More like this')).toBeNull();
  });
});
