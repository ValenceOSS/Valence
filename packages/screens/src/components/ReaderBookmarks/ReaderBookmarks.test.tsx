import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReaderBookmarks } from './ReaderBookmarks';
import type { DescribedBookmark } from '@ValenceClient/books/describeBookmark';

const A_PAGE: DescribedBookmark = {
  id: 'mark-page',
  place: 'Page 12',
  chapter: 'Volume 2',
  excerpt: null,
  picture: '/api/books/book/chapters/chapter/pages/11?width=120',
};

const A_PLACE: DescribedBookmark = {
  id: 'mark-place',
  place: '37%',
  chapter: null,
  excerpt: 'It is a truth universally acknowledged.',
  picture: null,
};

/**
 * Draws the list of bookmarks, with handlers to watch.
 */
const draw = (bookmarks: readonly DescribedBookmark[]) => {
  const handlers = { onOpen: vi.fn(), onRemove: vi.fn() };

  const { container } = render(<ReaderBookmarks bookmarks={bookmarks} {...handlers} />);

  return { ...handlers, container };
};

describe('ReaderBookmarks', () => {
  it('says there are none yet when nothing is bookmarked', () => {
    draw([]);

    expect(screen.getByRole('region', { name: 'Bookmarks' })).toBeInTheDocument();
    expect(screen.getByText('No bookmarks yet')).toBeInTheDocument();
    expect(screen.getByText('Pages you bookmark appear here.')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('shows each bookmark by its place, chapter, words and picture', () => {
    const { container } = draw([A_PAGE, A_PLACE]);
    const rows = screen.getAllByRole('listitem');

    expect(rows).toHaveLength(2);
    expect(within(rows[0] ?? document.body).getByText('Page 12')).toBeInTheDocument();
    expect(within(rows[0] ?? document.body).getByText('Volume 2')).toBeInTheDocument();
    expect(within(rows[1] ?? document.body).getByText('37%')).toBeInTheDocument();
    expect(
      within(rows[1] ?? document.body).getByText('It is a truth universally acknowledged.'),
    ).toBeInTheDocument();
    expect([...container.querySelectorAll('img')].map((one) => one.getAttribute('src'))).toEqual([
      '/api/books/book/chapters/chapter/pages/11?width=120',
    ]);
  });

  it('goes to the bookmark chosen', async () => {
    const { onOpen } = draw([A_PAGE, A_PLACE]);

    await userEvent.click(screen.getByRole('button', { name: /^37%/ }));

    expect(onOpen).toHaveBeenCalledWith('mark-place');
  });

  it('removes a bookmark from the cross beside it, named for its place', async () => {
    const { onRemove, onOpen } = draw([A_PAGE, A_PLACE]);

    await userEvent.click(screen.getByRole('button', { name: 'Remove bookmark at Page 12' }));

    expect(onRemove).toHaveBeenCalledWith('mark-page');
    expect(onOpen).not.toHaveBeenCalled();
  });
});
