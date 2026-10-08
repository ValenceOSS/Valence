import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DevelopersPage } from './DevelopersPage';

describe('DevelopersPage', () => {
  it('names the page', () => {
    render(<DevelopersPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Contracts first, then');
  });

  it('sets out every point the page makes', () => {
    render(<DevelopersPage />);

    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(
      screen.getByRole('heading', { level: 2, name: 'OpenAPI reference' }),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DevelopersPage.displayName).toBe('DevelopersPage');
  });
});
