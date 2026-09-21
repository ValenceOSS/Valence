import { screen, waitFor } from '@testing-library/react';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchArea } from './SearchArea';
import type { LibraryFacets, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { Book } from '@ValenceContracts/schemas/Book';

type Page = { items: MediaSummary[]; total: number };
type Options = {
  search?: string;
  kind?: string;
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  limit?: number;
};

const fetchLibraries = vi.fn<() => Promise<{ id: string }[]>>();
const fetchLibraryItems = vi.fn<(libraryId: string, options?: Options) => Promise<Page>>();

const fetchFacets = vi.fn<() => Promise<LibraryFacets>>();

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: () => fetchLibraries(),
  fetchLibraryItems: (libraryId: string, options?: Options) =>
    fetchLibraryItems(libraryId, options),
}));

const findBooks = vi.fn<(query: { search?: string }) => Promise<Book[]>>();

vi.mock('@ValenceClient/books/fetchBooks', () => ({
  findBooks: (query: { search?: string }) => findBooks(query),
  bookCoverUrl: (bookId: string) => `/api/books/${bookId}/cover`,
}));

vi.mock('@ValenceClient/library/fetchFacets', () => ({
  fetchFacets: () => fetchFacets(),
}));

const facets: LibraryFacets = {
  genres: ['Science fiction'],
  decades: [2010, 1990],
  maxRating: 8.4,
};

const item = (id: string, title: string, genres?: string[]): MediaSummary => ({
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
  ...(genres === undefined ? {} : { genres }),
});

beforeEach(() => {
  fetchLibraries.mockReset().mockResolvedValue([{ id: 'library-1' }]);
  fetchLibraryItems
    .mockReset()
    .mockResolvedValue({ items: [item('a', 'Arrival', ['Science fiction'])], total: 1 });
  fetchFacets.mockReset().mockResolvedValue(facets);
  findBooks.mockReset().mockResolvedValue([A_BOOK]);
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

/**
 * Searches for something, with a way to open a book.
 */
const searchFor = (search: string, onOpenBook = vi.fn()) => {
  renderInAnAddress(
    <SearchArea
      search={search}
      onSearchChange={vi.fn()}
      genre={null}
      onGenreChange={vi.fn()}
      onPlay={vi.fn()}
      onInspect={vi.fn()}
      onOpenBook={onOpenBook}
    />,
  );

  return onOpenBook;
};

vi.mock('@ValenceUI/useHasScrolledPast', () => ({
  useHasScrolledPast: () => ({ mark: () => undefined, hasPassed: true }),
}));

describe('SearchArea', () => {
  it('offers the way back to the top once the top has been left', async () => {
    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );

    expect(await screen.findByRole('button', { name: 'Back to top' })).toBeInTheDocument();
  });

  it('offers somewhere to type', async () => {
    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );

    expect(await screen.findByRole('searchbox')).toBeInTheDocument();
  });

  it('asks the server rather than sifting what happened to arrive', async () => {
    renderInAnAddress(
      <SearchArea
        search="arrival"
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenCalledWith(
        'library-1',
        expect.objectContaining({ search: 'arrival' }),
      );
    });
  });

  it('narrows to one kind of thing on request', async () => {
    const user = userEvent.setup();

    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );
    await user.click(await screen.findByRole('button', { name: 'Films' }));

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenCalledWith(
        'library-1',
        expect.objectContaining({ kind: 'films' }),
      );
    });
  });

  it('offers the genres the library actually has', async () => {
    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );

    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Filter the library' }));

    expect(await screen.findByRole('checkbox', { name: 'Science fiction' })).toBeInTheDocument();
  });

  it('shows what it found', async () => {
    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );

    expect(await screen.findByRole('button', { name: /Arrival/ })).toBeInTheDocument();
  });

  it('says how to get back when nothing matches everything asked', async () => {
    const user = userEvent.setup();

    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );
    await user.click(await screen.findByRole('button', { name: 'Films' }));
    fetchLibraryItems.mockResolvedValue({ items: [], total: 0 });

    expect(await screen.findByText(/Taking one of the filters off/)).toBeInTheDocument();
  });

  it('takes the genre off on request, from the chip that says it is on', async () => {
    const onGenreChange = vi.fn();
    const user = userEvent.setup();

    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre="Science fiction"
        onGenreChange={onGenreChange}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );
    await user.click(await screen.findByRole('button', { name: 'Clear all' }));

    expect(onGenreChange).toHaveBeenCalledWith(null);
  });

  it('draws a programme once rather than once per episode', async () => {
    fetchLibraryItems.mockResolvedValue({
      items: [
        { ...item('e1', 'Pilot'), seriesId: 'ted', seriesTitle: 'Ted Lasso', episodeNumber: 1 },
        { ...item('e2', 'Biscuits'), seriesId: 'ted', seriesTitle: 'Ted Lasso', episodeNumber: 2 },
      ],
      total: 2,
    });

    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );

    expect(await screen.findByText('1 result')).toBeInTheDocument();
  });

  it('opens the programme rather than the episode when a programme is chosen', async () => {
    fetchLibraryItems.mockResolvedValue({
      items: [
        { ...item('e1', 'Pilot'), seriesId: 'ted', seriesTitle: 'Ted Lasso', episodeNumber: 1 },
        { ...item('e2', 'Biscuits'), seriesId: 'ted', seriesTitle: 'Ted Lasso', episodeNumber: 2 },
      ],
      total: 2,
    });

    const onOpenShow = vi.fn();
    const onInspect = vi.fn();

    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={onInspect}
        onOpenShow={onOpenShow}
      />,
    );

    await userEvent.setup().click(await screen.findByRole('button', { name: /Ted Lasso/ }));

    expect(onOpenShow).toHaveBeenCalledOnce();
    expect(onInspect).not.toHaveBeenCalled();
  });

  it('replaces the whole result set on a filter change, not only the cards that differ', async () => {
    const user = userEvent.setup();

    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );

    const before = await screen.findByRole('button', { name: /Arrival/ });

    await user.click(screen.getByRole('button', { name: 'Films' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Arrival/ })).not.toBe(before);
    });
  });

  it('keeps the narrower filters in a panel until they are asked for', async () => {
    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );

    await screen.findByRole('button', { name: 'Filter the library' });

    expect(screen.queryByRole('checkbox', { name: '1990s' })).not.toBeInTheDocument();
  });

  it('asks for a decade as the years either side of it', async () => {
    const user = userEvent.setup();

    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );
    await user.click(await screen.findByRole('button', { name: 'Filter the library' }));
    await user.click(await screen.findByRole('checkbox', { name: '1990s' }));

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenCalledWith(
        'library-1',
        expect.objectContaining({ yearFrom: 1990, yearTo: 1999 }),
      );
    });
  });

  it('asks for a rating floor', async () => {
    const user = userEvent.setup();

    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );
    await user.click(await screen.findByRole('button', { name: 'Filter the library' }));
    await user.click(await screen.findByRole('checkbox', { name: '8+' }));

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenCalledWith(
        'library-1',
        expect.objectContaining({ minRating: 8 }),
      );
    });
  });

  it('says how many filters are on, since they are in a panel', async () => {
    const user = userEvent.setup();

    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );
    await user.click(await screen.findByRole('button', { name: 'Filter the library' }));
    await user.click(await screen.findByRole('checkbox', { name: '1990s' }));

    expect(await screen.findByRole('button', { name: 'Filter the library' })).toHaveTextContent(
      '1',
    );
  });

  it('takes every filter off at once when asked to clear', async () => {
    const user = userEvent.setup();

    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );
    await user.click(await screen.findByRole('button', { name: 'Filter the library' }));
    await user.click(await screen.findByRole('checkbox', { name: '1990s' }));
    await user.keyboard('{Escape}');
    await user.click(await screen.findByRole('button', { name: 'Clear all' }));

    expect(screen.queryByRole('list', { name: 'Applied filters' })).not.toBeInTheDocument();
  });

  it('offers nothing that would only lead to an empty page', async () => {
    fetchFacets.mockResolvedValue({ genres: [], decades: [1990], maxRating: 0 });

    const user = userEvent.setup();

    renderInAnAddress(
      <SearchArea
        search=""
        onSearchChange={vi.fn()}
        genre={null}
        onGenreChange={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
      />,
    );
    await user.click(await screen.findByRole('button', { name: 'Filter the library' }));

    expect(screen.queryByRole('group', { name: 'Rating' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Genre' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Decade' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SearchArea.displayName).toBe('SearchArea');
  });

  it('finds books by what was typed, beside films and shows', async () => {
    searchFor('austen');

    expect(await screen.findByText('Pride and Prejudice')).toBeInTheDocument();
    expect(findBooks).toHaveBeenCalledWith({ search: 'austen' });
    expect(screen.getByText('2 results')).toBeInTheDocument();
  });

  it('opens a book chosen from the results', async () => {
    const onOpenBook = searchFor('austen');

    await userEvent.click(await screen.findByText('Pride and Prejudice'));

    expect(onOpenBook).toHaveBeenCalledWith(A_BOOK);
  });

  it('looks for no books until something has been typed', async () => {
    searchFor('');

    await screen.findByText('Arrival');

    expect(findBooks).not.toHaveBeenCalled();
  });

  it('searches only books when only books are wanted', async () => {
    searchFor('austen');

    await userEvent.click(await screen.findByRole('button', { name: 'Books' }));

    await waitFor(() => {
      expect(screen.queryByText('Arrival')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Pride and Prejudice')).toBeInTheDocument();
  });
});
