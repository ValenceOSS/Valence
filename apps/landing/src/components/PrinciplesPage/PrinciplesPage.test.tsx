import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrinciplesPage } from './PrinciplesPage';

describe('PrinciplesPage', () => {
  it('names the page', () => {
    render(<PrinciplesPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('What Valence holds to');
  });

  it('sets out every point the page makes, what it refuses included', () => {
    render(<PrinciplesPage />);

    expect(screen.getAllByRole('article')).toHaveLength(7);
    expect(screen.getByRole('heading', { level: 2, name: 'What it refuses' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PrinciplesPage.displayName).toBe('PrinciplesPage');
  });
});
