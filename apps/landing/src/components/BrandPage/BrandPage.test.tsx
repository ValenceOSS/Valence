import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandPage } from './BrandPage';

describe('BrandPage', () => {
  it('names the page and offers the brand kit to save', () => {
    render(<BrandPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Valence brand guidelines' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download the brand kit' })).toHaveAttribute(
      'download',
      'Valence Brand Kit.zip',
    );
  });

  it('sets out the mark, the logo, its motion, the app icon, where it goes, the typefaces and the colours', () => {
    render(<BrandPage />);

    for (const part of [
      'The mark',
      'Logo',
      'Motion',
      'App icon',
      'Placement',
      'Typography',
      'Colour',
    ]) {
      expect(screen.getByRole('region', { name: part })).toBeInTheDocument();
    }
  });

  it('sets the wordmark in Plus Jakarta Sans ExtraBold, and names every colour by its hex', () => {
    render(<BrandPage />);

    expect(screen.getByText('Plus Jakarta Sans ExtraBold')).toBeInTheDocument();
    expect(screen.getByText('Wordmark and display')).toBeInTheDocument();
    expect(screen.getByText('#0066FF')).toBeInTheDocument();
  });

  it('offers no wallpapers', () => {
    render(<BrandPage />);

    expect(screen.queryByRole('region', { name: 'Wallpapers' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BrandPage.displayName).toBe('BrandPage');
  });
});
