import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { useAudiobooks } from '@ValenceTv/books/useAudiobooks';
import type { ReactNode } from 'react';

const { book } = anAudiobook();

const drawIn =
  (cache: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cache}>{children}</QueryClientProvider>
  );

describe('useAudiobooks', () => {
  it('gathers every book there is to hear across the libraries, by title', async () => {
    const cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

    cache.setQueryData(bookQueries.inLibrary('one').queryKey, [
      { ...book, id: 'b', title: 'Morning Star' },
      { ...book, id: 'c', title: 'A Novel', hasAudio: false },
    ]);
    cache.setQueryData(bookQueries.inLibrary('two').queryKey, [book]);

    const { result } = await renderHook(() => useAudiobooks(['one', 'two']), {
      wrapper: drawIn(cache),
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.books.map(({ title }) => title)).toEqual(['Morning Star', 'Red Rising']);
  });

  it('is still reading while a library has not answered', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));

    const { result } = await renderHook(() => useAudiobooks(['one']), {
      wrapper: drawIn(new QueryClient()),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.books).toEqual([]);
  });
});
