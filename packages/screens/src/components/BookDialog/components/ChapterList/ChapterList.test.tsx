import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChapterList } from './ChapterList';
import type { BookChapter } from '@ValenceContracts/schemas/Book';

const chapter = (
  id: string,
  number: number,
  title: string,
  pageCount: number | null,
): BookChapter => ({
  id,
  bookId: 'b',
  number,
  title,
  format: 'cbz',
  pageCount,
  addedAt: '2026-09-24T00:00:00.000Z',
});

const CHAPTERS = [
  chapter('c1', 1, 'The Journey Begins', 24),
  chapter('c2', 2, 'A Promise', 20),
  chapter('c3', 3, 'Snow', null),
];

describe('ChapterList', () => {
  it('lists each chapter with its name, its pages, and how much of it is read', () => {
    render(
      <ChapterList
        chapters={CHAPTERS}
        read={
          new Map([
            ['c1', 1],
            ['c2', 0.5],
          ])
        }
        onOpen={vi.fn()}
      />,
    );

    const [first, second, third] = screen.getAllByRole('listitem');

    expect(within(first ?? document.body).getByText('The Journey Begins')).toBeInTheDocument();
    expect(within(first ?? document.body).getByText('24 pages')).toBeInTheDocument();
    expect(within(first ?? document.body).getByRole('img', { name: 'Read' })).toBeInTheDocument();
    expect(within(second ?? document.body).getByText('50% read')).toBeInTheDocument();
    expect(within(second ?? document.body).getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(within(third ?? document.body).getByText('Reflows to fit')).toBeInTheDocument();
    expect(within(third ?? document.body).queryByText(/read/)).not.toBeInTheDocument();
  });

  it('opens the chapter pressed', async () => {
    const onOpen = vi.fn();

    render(<ChapterList chapters={CHAPTERS} read={new Map()} onOpen={onOpen} />);

    await userEvent.click(screen.getByRole('button', { name: 'Read A Promise' }));

    expect(onOpen).toHaveBeenCalledWith('c2');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ChapterList.displayName).toBe('ChapterList');
  });
});
