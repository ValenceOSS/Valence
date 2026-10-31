import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FigureRow } from './FigureRow';

describe('FigureRow', () => {
  it('sets out three numbered figures, each with a title', () => {
    render(<FigureRow />);

    const row = screen.getByRole('region', { name: 'What Valence is' });

    expect(
      within(row)
        .getAllByRole('heading', { level: 3 })
        .map((title) => title.textContent),
    ).toEqual(['Yours', 'Every kind of media', 'Built to share']);
    expect(within(row).getByText('Fig 0.1')).toBeInTheDocument();
    expect(within(row).getByText('Fig 0.3')).toBeInTheDocument();
  });

  it('says in one line what each figure means', () => {
    render(<FigureRow />);

    expect(
      screen.getByText('Films, shows, music and books, kept together in one place.'),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FigureRow.displayName).toBe('FigureRow');
  });
});
