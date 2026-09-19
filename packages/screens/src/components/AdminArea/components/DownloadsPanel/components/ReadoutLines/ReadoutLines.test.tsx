import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReadoutLines } from './ReadoutLines';

describe('ReadoutLines', () => {
  it('puts each figure on a line of its own', () => {
    render(<ReadoutLines lines={['↓ 20 MB/s', '↑ 0 B/s']} />);

    expect(screen.getByText('↓ 20 MB/s')).toBeInTheDocument();
    expect(screen.getByText('↑ 0 B/s')).toBeInTheDocument();
  });

  it('shows a dash where there are none', () => {
    render(<ReadoutLines lines={[]} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReadoutLines.displayName).toBe('ReadoutLines');
  });
});
