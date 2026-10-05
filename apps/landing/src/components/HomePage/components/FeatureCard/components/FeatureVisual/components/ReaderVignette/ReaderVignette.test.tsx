import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReaderVignette } from './ReaderVignette';

describe('ReaderVignette', () => {
  it('shows a book open in the reader, two columns side by side', () => {
    render(<ReaderVignette />);

    expect(screen.getByText('A Christmas Carol — Stave I: Marley’s Ghost')).toBeInTheDocument();
    expect(screen.getByText('“Are there no prisons?” asked Scrooge.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReaderVignette.displayName).toBe('ReaderVignette');
  });
});
