import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReaderVignette } from './ReaderVignette';

describe('ReaderVignette', () => {
  it('shows a page of a book, with its chapter', () => {
    render(<ReaderVignette />);

    expect(screen.getAllByText('The Salt Road')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReaderVignette.displayName).toBe('ReaderVignette');
  });
});
