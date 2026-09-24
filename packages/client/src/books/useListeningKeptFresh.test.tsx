import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { listeningKept } from '@ValenceClient/books/listeningKept';
import { useListeningKeptFresh } from '@ValenceClient/books/useListeningKeptFresh';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import type { ReactNode } from 'react';

describe('useListeningKeptFresh', () => {
  it('reads where somebody is again once a place in a book is kept', () => {
    const cache = new QueryClient();
    const invalidate = vi.spyOn(cache, 'invalidateQueries');

    renderHook(
      () => {
        useListeningKeptFresh();
      },
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={cache}>{children}</QueryClientProvider>
        ),
      },
    );
    listeningKept.tell('book-1');

    expect(invalidate).toHaveBeenCalledWith({ queryKey: bookQueries.listening().queryKey });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: bookQueries.listeningPlace('book-1').queryKey,
    });
  });
});
