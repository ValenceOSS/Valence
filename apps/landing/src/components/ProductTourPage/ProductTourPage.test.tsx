import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductTourPage } from './ProductTourPage';

describe('ProductTourPage', () => {
  it('names the page', () => {
    render(<ProductTourPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('The parts of');
  });

  it('sets out every point the page makes', () => {
    render(<ProductTourPage />);

    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(screen.getByRole('heading', { level: 2, name: 'Watching' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ProductTourPage.displayName).toBe('ProductTourPage');
  });
});
