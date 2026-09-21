import { screen, waitFor } from '@testing-library/react';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowseArea } from './BrowseArea';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { Book } from '@ValenceContracts/schemas/Book';
import userEvent from '@testing-library/user-event';

type Page = { items: MediaSummary[]; total: number };
type Options = { kind?: string; order?: string; ids?: string[]; limit?: number };

const fetchLibraries = vi.fn<() => Promise<{ id: string }[]>>();
const fetchFacets =
  vi.fn<() => Promise<{ genres: string[]; decades: number[]; maxRating: number }>>();

vi.mock('@ValenceClient/library/fetchFacets', () => ({
  fetchFacets: () => fetchFacets(),
}));
const fetchLibraryItems = vi.fn<(libraryId: string, options?: Options) => Promise<Page>>();

const findBooks = vi.fn<(query: { ids?: readonly string[] }) => Promise<Book[]>>();

vi.mock('@ValenceClient/books/fetchBooks', () => ({
  findBooks: (query: { ids?: readonly string[] }) => findBooks(query),
  bookCoverUrl: (bookId: string) => `/api/books/${bookId}/cover`,
}));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: () => fetchLibraries(),
  fetchLibraryItems: (libraryId: string, options?: Options) =>
    fetchLibraryItems(libraryId, options),
}));

const item = (id: string, title: string): MediaSummary => ({
  id,
  libraryId: 'library-1',
  title,
  year: 2016,
  durationSeconds: 7200,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
});

const A_BOOK: Book = {
  id: 'book-1',
  libraryId: 'library-2',
  title: 'Pride and Prejudice',
  layout: 'reflow',
  direction: 'leftToRight',
  year: 1813,
  overview: null,
  genres: null,
  authors: ['Jane Austen'],
  rating: null,
  hasCover: true,
  chapterCount: 1,
  addedAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

beforeEach(() => {
  findBooks.mockReset().mockResolvedValue([A_BOOK]);
  fetchFacets
    .mockReset()
    .mockResolvedValue({ genres: ['Drama'], decades: [1990, 2010], maxRating: 8.5 });
  fetchLibraries.mockReset().mockResolvedValue([{ id: 'library-1' }]);
  fetchLibraryItems.mockReset().mockResolvedValue({ items: [item('a', 'Arrival')], total: 1 });
});

vi.mock('@ValenceUI/useHasScrolledPast', () => ({
  useHasScrolledPast: () => ({ mark: () => undefined, hasPassed: true }),
}));

describe('BrowseArea', () => {
  it('names the page it is', async () => {
    renderInAnAddress(<BrowseArea kind="shows" onPlay={vi.fn()} onInspect={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'Shows' })).toBeInTheDocument();
  });

  it('offers the way back to the top once the top has been left', async () => {
    renderInAnAddress(<BrowseArea kind="shows" onPlay={vi.fn()} onInspect={vi.fn()} />);

    expect(await screen.findByRole('button', { name: 'Back to top' })).toBeInTheDocument();
  });

  it('asks the server for what comes in episodes', async () => {
    renderInAnAddress(<BrowseArea kind="shows" onPlay={vi.fn()} onInspect={vi.fn()} />);

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenCalledWith(
        'library-1',
        expect.objectContaining({ kind: 'shows' }),
      );
    });
  });

  it('asks for the newest first on the page about newness', async () => {
    renderInAnAddress(<BrowseArea kind="new" onPlay={vi.fn()} onInspect={vi.fn()} />);

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenCalledWith(
        'library-1',
        expect.objectContaining({ order: 'newest' }),
      );
    });
  });

  it('asks for exactly what this viewer kept, by name', async () => {
    renderInAnAddress(
      <BrowseArea kind="favourites" favourites={['a', 'b']} onPlay={vi.fn()} onInspect={vi.fn()} />,
    );

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenCalledWith(
        'library-1',
        expect.objectContaining({ ids: ['a', 'b'] }),
      );
    });
  });

  it('asks for nothing at all where nothing has been kept', async () => {
    renderInAnAddress(
      <BrowseArea kind="favourites" favourites={[]} onPlay={vi.fn()} onInspect={vi.fn()} />,
    );

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenCalledWith(
        'library-1',
        expect.objectContaining({ ids: [] }),
      );
    });
  });

  it('shows what it found', async () => {
    renderInAnAddress(<BrowseArea kind="films" onPlay={vi.fn()} onInspect={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Arrival/ })).toBeInTheDocument();
  });

  it('says what is missing in one line, rather than a line and an explanation of it', async () => {
    fetchLibraryItems.mockResolvedValue({ items: [], total: 0 });

    renderInAnAddress(<BrowseArea kind="favourites" onPlay={vi.fn()} onInspect={vi.fn()} />);

    expect(
      await screen.findByRole('heading', { name: 'Nothing has been favourited yet' }),
    ).toBeInTheDocument();
  });

  it('tells the page what it loaded, so an address can be turned back into an item', async () => {
    const onItemsLoaded = vi.fn();

    renderInAnAddress(
      <BrowseArea
        kind="films"
        onPlay={vi.fn()}
        onInspect={vi.fn()}
        onItemsLoaded={onItemsLoaded}
      />,
    );

    await waitFor(() => {
      expect(onItemsLoaded).toHaveBeenCalledWith([expect.objectContaining({ id: 'a' })]);
    });
  });

  it('says it could not be read when the server cannot be reached, rather than that it is empty', async () => {
    fetchLibraries.mockRejectedValue(new Error('offline'));

    renderInAnAddress(<BrowseArea kind="films" onPlay={vi.fn()} onInspect={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('could not be read');
    expect(screen.queryByText(/Nothing here stands on its own yet/)).not.toBeInTheDocument();
  });

  it('offers to try again, since a server that was down may not be', async () => {
    fetchLibraries.mockRejectedValue(new Error('offline'));

    renderInAnAddress(<BrowseArea kind="films" onPlay={vi.fn()} onInspect={vi.fn()} />);

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BrowseArea.displayName).toBe('BrowseArea');
  });

  it('says nothing about libraries on the page that is not about them', async () => {
    fetchLibraryItems.mockResolvedValue({ items: [], total: 0 });

    renderInAnAddress(<BrowseArea kind="favourites" onPlay={vi.fn()} onInspect={vi.fn()} />);

    await screen.findByRole('heading', { name: 'Nothing has been favourited yet' });

    expect(screen.queryByText(/Scan/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scan it' })).not.toBeInTheDocument();
  });

  it('talks about every library on the page that reads across all of them', async () => {
    fetchLibraryItems.mockResolvedValue({ items: [], total: 0 });

    renderInAnAddress(
      <BrowseArea kind="new" onPlay={vi.fn()} onInspect={vi.fn()} onAddLibrary={vi.fn()} />,
    );

    expect(
      await screen.findByText('Scan your libraries, or add files to them.'),
    ).toBeInTheDocument();
  });

  it('talks about the one library on a page that reads from one', async () => {
    fetchLibraryItems.mockResolvedValue({ items: [], total: 0 });

    renderInAnAddress(
      <BrowseArea kind="shows" onPlay={vi.fn()} onInspect={vi.fn()} onAddLibrary={vi.fn()} />,
    );

    expect(await screen.findByText('Scan it, or add files to its folder.')).toBeInTheDocument();
  });
});

describe('how a page of the library is laid out', () => {
  it('offers to narrow the films by genre, decade and rating, and asks the libraries for it', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<BrowseArea kind="films" onPlay={vi.fn()} onInspect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Filter films' }));
    await user.click(await screen.findByRole('checkbox', { name: '1990s' }));

    await vi.waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenCalledWith(
        'library-1',
        expect.objectContaining({ yearFrom: 1990, yearTo: 1999 }),
      );
    });

    expect(screen.getByText('Decade: 1990s')).toBeInTheDocument();
  });

  it('offers no filters on a page that is not one kind of thing', async () => {
    renderInAnAddress(<BrowseArea kind="new" onPlay={vi.fn()} onInspect={vi.fn()} />);

    await screen.findByRole('button', { name: /Arrival/ });

    expect(screen.queryByRole('button', { name: /^Filter/ })).not.toBeInTheDocument();
  });

  it('names the page for anybody reading it, without a banner saying it again', async () => {
    renderInAnAddress(<BrowseArea kind="films" onPlay={vi.fn()} onInspect={vi.fn()} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Films' })).toHaveClass('sr-only');
    expect(screen.queryByText('Everything that stands on its own.')).not.toBeInTheDocument();
  });

  it('stands films upright on their posters', async () => {
    const { container } = renderInAnAddress(
      <BrowseArea kind="films" onPlay={vi.fn()} onInspect={vi.fn()} />,
    );

    await screen.findByRole('button', { name: /Arrival/ });

    expect(container.querySelector('.aspect-\\[2\\/3\\]')).not.toBeNull();
    expect(container.querySelector('.aspect-video')).toBeNull();
  });

  it.each(['shows', 'new'] as const)('lays the %s page flat, on backdrops', async (kind) => {
    const { container } = renderInAnAddress(
      <BrowseArea kind={kind} onPlay={vi.fn()} onInspect={vi.fn()} />,
    );

    await screen.findByRole('button', { name: /Arrival/ });

    expect(container.querySelector('.aspect-video')).not.toBeNull();
    expect(container.querySelector('.aspect-\\[2\\/3\\]')).toBeNull();
  });

  it('still offers a choice of how large the cards are', async () => {
    renderInAnAddress(<BrowseArea kind="films" onPlay={vi.fn()} onInspect={vi.fn()} />);

    expect(
      await screen.findByRole('group', { name: 'How large the cards are' }),
    ).toBeInTheDocument();
  });

  it('shows the books this viewer kept beside everything else they kept', async () => {
    const onOpenBook = vi.fn();

    renderInAnAddress(
      <BrowseArea
        kind="favourites"
        favourites={['a']}
        keptBooks={['book-1']}
        onOpenBook={onOpenBook}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );

    expect(await screen.findByText('Pride and Prejudice')).toBeInTheDocument();
    expect(findBooks).toHaveBeenCalledWith({ ids: ['book-1'] });

    await userEvent.click(screen.getByText('Pride and Prejudice'));

    expect(onOpenBook).toHaveBeenCalledWith(A_BOOK);
  });

  it('is not empty when only a book was kept', async () => {
    fetchLibraryItems.mockResolvedValue({ items: [], total: 0 });

    renderInAnAddress(
      <BrowseArea
        kind="favourites"
        favourites={[]}
        keptBooks={['book-1']}
        onOpenBook={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );

    expect(await screen.findByText('Pride and Prejudice')).toBeInTheDocument();
    expect(screen.queryByText('Nothing has been favourited yet')).not.toBeInTheDocument();
  });

  it('asks for no books on a page that is not about favourites', async () => {
    renderInAnAddress(
      <BrowseArea kind="films" keptBooks={['book-1']} onPlay={vi.fn()} onInspect={vi.fn()} />,
    );

    await screen.findByText('Arrival');

    expect(findBooks).not.toHaveBeenCalled();
  });
});
