import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AskableBookTile } from './AskableBookTile';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

const BOOK: CatalogueTitle = {
  kind: 'book',
  id: '21277329',
  title: 'Project Hail Mary',
  subtitle: 'Andy Weir',
  year: 2021,
  overview: null,
  posterUrl: 'https://covers.openlibrary.org/b/id/1-M.jpg',
  standing: { status: 'askable', mediaId: null, requestId: null, requestState: null },
};

describe('AskableBookTile', () => {
  it('names the book, who wrote it and when', () => {
    render(<AskableBookTile title={BOOK} onAsk={vi.fn()} />);

    expect(screen.getByText('Project Hail Mary')).toBeInTheDocument();
    expect(screen.getByText('Andy Weir · 2021')).toBeInTheDocument();
  });

  it('opens the page for asking, by the address the book goes by', async () => {
    const onAsk = vi.fn();

    render(<AskableBookTile title={BOOK} onAsk={onAsk} />);

    await userEvent.click(screen.getByRole('button', { name: /Project Hail Mary/ }));

    expect(onAsk).toHaveBeenCalledWith('book:21277329');
  });

  it('says a book is already in the library', () => {
    render(
      <AskableBookTile
        title={{
          ...BOOK,
          standing: { status: 'library', mediaId: 'b1', requestId: null, requestState: null },
        }}
        onAsk={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('In your library')).toBeInTheDocument();
  });

  it('copes with a book that has no author, year or cover', () => {
    render(
      <AskableBookTile
        title={{ ...BOOK, subtitle: null, year: null, posterUrl: null }}
        onAsk={vi.fn()}
      />,
    );

    expect(screen.getByText('Project Hail Mary')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AskableBookTile.displayName).toBe('AskableBookTile');
  });
});
