import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AgeRating } from './AgeRating';

describe('AgeRating', () => {
  it("shows a certificate as its board's own mark, said aloud with the board's name", () => {
    render(<AgeRating certification="15" region="GB" />);

    const mark = screen.getByRole('img', { name: 'Rated 15 by the BBFC' });

    expect(mark.tagName).toBe('IMG');
    expect(mark).toHaveAttribute('src', expect.stringContaining('bbfc-15'));
  });

  it('writes a certificate out where its board issues no mark for it', () => {
    render(<AgeRating certification="16" region="IE" />);

    const written = screen.getByRole('img', { name: 'Rated 16 by the IFCO' });

    expect(written.tagName).toBe('SPAN');
    expect(written).toHaveTextContent('16');
  });

  it('stands larger when asked', () => {
    render(<AgeRating certification="PG-13" region="US" size="md" />);

    expect(screen.getByRole('img', { name: 'Rated PG-13 by the MPA' })).toHaveClass('h-8');
  });

  it('takes the caller’s own classes', () => {
    render(<AgeRating certification="16" region="IE" className="ml-2" />);

    expect(screen.getByRole('img')).toHaveClass('ml-2');
  });
});
