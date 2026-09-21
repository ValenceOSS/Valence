import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { BooksDiscover } from './BooksDiscover';
import type { CatalogueDiscovery, CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

const discovery = vi.hoisted((): { current: CatalogueDiscovery } => ({
  current: { shelves: [], studios: [] },
}));

const searchAskable = vi.hoisted(() =>
  vi.fn<(query: string, kind: string) => Promise<CatalogueTitle[]>>(),
);

vi.mock('@ValenceClient/requests/fetchAskable', () => ({
  fetchDiscover: () => Promise.resolve(discovery.current),
  searchAskable: (query: string, kind: string) => searchAskable(query, kind),
}));

const standing = { status: 'askable', mediaId: null, requestId: null, requestState: null } as const;

const aBook = (id: string, title: string): CatalogueTitle => ({
  kind: 'book',
  id,
  title,
  subtitle: 'Somebody',
  year: 2021,
  overview: null,
  posterUrl: null,
  standing,
});

beforeEach(() => {
  searchAskable.mockReset().mockResolvedValue([aBook('9', 'Found It')]);
  discovery.current = {
    studios: [],
    shelves: [
      {
        id: 'trending-films',
        title: 'Trending films',
        browse: null,
        titles: [
          {
            kind: 'film',
            id: '1',
            title: 'Dune',
            subtitle: null,
            year: 2021,
            overview: null,
            posterUrl: null,
            standing,
          },
        ],
      },
      {
        id: 'trending-books',
        title: 'Trending books',
        browse: null,
        titles: [aBook('21277329', 'Project Hail Mary')],
      },
    ],
  };
});

describe('BooksDiscover', () => {
  it('shelves the books there are to ask for, and not the films', async () => {
    renderInAnAddress(<BooksDiscover onAsk={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'Trending books' })).toBeInTheDocument();
    expect(screen.getByText('Project Hail Mary')).toBeInTheDocument();
    expect(screen.queryByText('Dune')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Trending films' })).not.toBeInTheDocument();
  });

  it('opens a book for asking, by the address it goes by', async () => {
    const onAsk = vi.fn();

    renderInAnAddress(<BooksDiscover onAsk={onAsk} />);

    await userEvent.click(await screen.findByRole('button', { name: /Project Hail Mary/ }));

    expect(onAsk).toHaveBeenCalledWith('book:21277329');
  });

  it('searches for a book by what is typed, in place of the shelves', async () => {
    renderInAnAddress(<BooksDiscover onAsk={vi.fn()} />);

    await screen.findByRole('heading', { name: 'Trending books' });
    await userEvent.type(screen.getByLabelText('Search for a book'), 'found');

    expect(await screen.findByText('Found It')).toBeInTheDocument();
    expect(searchAskable).toHaveBeenLastCalledWith('found', 'book');
    expect(screen.queryByRole('heading', { name: 'Trending books' })).not.toBeInTheDocument();
  });

  it('says so when a search finds nothing', async () => {
    searchAskable.mockResolvedValue([]);

    renderInAnAddress(<BooksDiscover onAsk={vi.fn()} />);

    await userEvent.type(await screen.findByLabelText('Search for a book'), 'zzz');

    expect(await screen.findByText('No books found')).toBeInTheDocument();
  });

  it('still offers a search where there are no shelves to show', async () => {
    discovery.current = { studios: [], shelves: [] };

    renderInAnAddress(<BooksDiscover onAsk={vi.fn()} />);

    expect(await screen.findByText('No books to ask for')).toBeInTheDocument();
    expect(screen.getByLabelText('Search for a book')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BooksDiscover.displayName).toBe('BooksDiscover');
  });
});
