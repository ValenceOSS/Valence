import { act, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { Alert } from 'react-native';
import { fetchReading, forgetReading } from '@ValenceClient/books/fetchBooks';
import { fetchHistory, forgetHistory } from '@ValenceClient/history/fetchHistory';
import { aBook } from '@ValencePhone/testing/aBook';
import { TheHistory } from './TheHistory';

jest.mock('@ValenceClient/history/fetchHistory', () => ({
  ...jest.requireActual<object>('@ValenceClient/history/fetchHistory'),
  fetchHistory: jest.fn(),
  forgetHistory: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('@ValenceClient/books/fetchBooks', () => ({
  ...jest.requireActual<object>('@ValenceClient/books/fetchBooks'),
  fetchReading: jest.fn(),
  forgetReading: jest.fn(() => Promise.resolve(true)),
}));

const ARRIVAL = {
  id: 'v1',
  mediaItemId: 'arrival',
  title: 'Arrival',
  seriesTitle: null,
  startedAt: '2026-09-22T10:00:00.000Z',
  lastWatchedAt: '2026-09-22T12:00:00.000Z',
  secondsWatched: 3600,
  isFinished: false,
};

const DUNE = {
  book: aBook(),
  chapterId: '00000000-0000-4000-8000-0000000000c1',
  chapterTitle: 'Chapter 1',
  pageNumber: null,
  pageCount: null,
  fraction: 0.42,
  isFinished: false,
  updatedAt: '2026-09-23T10:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  installPlatform(aFakePlatform());
  jest.mocked(fetchHistory).mockResolvedValue([ARRIVAL]);
  jest.mocked(fetchReading).mockResolvedValue([DUNE]);
});

describe('TheHistory', () => {
  it('lists what was watched and read together, newest first', async () => {
    const drawn = await render(<TheHistory />, { wrapper: CacheScope });

    expect(await drawn.findByText('Dune')).toBeTruthy();
    expect(drawn.getByText('Arrival')).toBeTruthy();
    expect(drawn.getByText(/42% read/u)).toBeTruthy();
  });

  it('forgets one book', async () => {
    const drawn = await render(<TheHistory />, { wrapper: CacheScope });

    await userEvent.press(await drawn.findByRole('button', { name: 'Forget Dune' }));

    expect(forgetReading).toHaveBeenCalledWith(aBook().id);
  });

  it('forgets everything watched and read once asked', async () => {
    const asking = jest.spyOn(Alert, 'alert');
    const drawn = await render(<TheHistory />, { wrapper: CacheScope });

    await userEvent.press(await drawn.findByText('Forget everything'));
    await act(() => {
      asking.mock.calls
        .at(-1)?.[2]
        ?.find((button) => button.style === 'destructive')
        ?.onPress?.();
    });

    expect(forgetHistory).toHaveBeenCalled();
    expect(forgetReading).toHaveBeenCalledWith();
  });
});
