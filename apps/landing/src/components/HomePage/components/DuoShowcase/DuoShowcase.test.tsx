import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DuoShowcase } from './DuoShowcase';

describe('DuoShowcase', () => {
  it('says what Valence does on the iPhone Duo', () => {
    render(<DuoShowcase />);

    expect(screen.getByRole('heading', { name: /Folded or open/ })).toBeInTheDocument();
  });

  it('shows a book turning its pages on the open Duo, silent and looping', () => {
    render(<DuoShowcase />);

    const film = screen.getByLabelText(/turning over with a page curl/);

    expect(film).toHaveAttribute('src', '/duo/page-turn.mp4');
    expect(film).toHaveAttribute('poster', '/duo/page-turn-poster.webp');
    expect(film).toHaveProperty('loop', true);
    expect(film).toHaveProperty('muted', true);
  });

  it('stands the folded Duo in front, with the same book on its outer screen', () => {
    render(<DuoShowcase />);

    expect(screen.getByAltText(/folded iPhone Duo's outer screen/)).toHaveAttribute(
      'src',
      '/duo/folded-reader.webp',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DuoShowcase.displayName).toBe('DuoShowcase');
  });
});
