import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BookPage } from './BookPage';

describe('BookPage', () => {
  it('sets the page out with its chapter, its words and its number', () => {
    render(<BookPage lines={['The tide had left', 'the road by noon.']} number={212} />);

    expect(screen.getByText('Chapter 7')).toBeInTheDocument();
    expect(screen.getByText('The tide had left the road by noon.')).toBeInTheDocument();
    expect(screen.getByText('212')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BookPage.displayName).toBe('BookPage');
  });
});
