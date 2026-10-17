import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LibraryHealthPanel } from './LibraryHealthPanel';

const list = (items: object[]) => ({ total: items.length, items });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LibraryHealthPanel', () => {
  it('lists the titles the catalogue never matched', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              checkedAt: '2026-10-17T00:00:00.000Z',
              unmatched: list([
                {
                  id: 'a',
                  title: 'Home Movies',
                  year: null,
                  libraryId: 'l',
                  libraryName: 'Films',
                  path: '/films/Home Movies/clip.mkv',
                  group: null,
                },
              ]),
              noArtwork: list([]),
              duplicate: list([]),
              unreadable: list([]),
            }),
          ),
        ),
      ),
    );

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <LibraryHealthPanel onCorrect={vi.fn()} onChooseArtwork={vi.fn()} onOpenFolder={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Home Movies')).toBeInTheDocument();
  });
});
