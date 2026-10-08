import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ComparePage } from './ComparePage';

describe('ComparePage', () => {
  it('names the page', () => {
    render(<ComparePage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Built for people');
  });

  it('sets out every point the page makes', () => {
    render(<ComparePage />);

    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(
      screen.getByRole('heading', { level: 2, name: 'One library surface' }),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ComparePage.displayName).toBe('ComparePage');
  });
});
