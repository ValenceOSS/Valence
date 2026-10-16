import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { BookFormats } from './BookFormats';

describe('BookFormats', () => {
  it('shows the ebook as one block and the audiobook as a block for each part', () => {
    render(
      <BookFormats
        approval="approved"
        narrations={[{ asin: 'A', narrators: ['Ann Reader'], runtimeMinutes: 732, series: null }]}
        items={[
          aRequestItem({ id: 'e', format: 'ebook', state: 'available' }),
          aRequestItem({
            id: 'a',
            format: 'audiobook',
            narration: 'A',
            state: 'filed',
            trackCount: 12,
          }),
        ]}
      />,
    );

    expect(screen.getByText('Ebook')).toBeInTheDocument();
    expect(screen.getByText('Audiobook')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '12 parts, In the library' })).toBeInTheDocument();
    expect(screen.getByText(/Ann Reader/)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BookFormats.displayName).toBe('BookFormats');
  });
});
