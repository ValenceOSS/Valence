import { render, screen, within } from '@testing-library/react';
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

  it('sets out the logo, where it goes, the typefaces, the colours and the wallpapers', () => {
    render(<BrandPage />);

    for (const part of ['Logo', 'Placement', 'Typography', 'Colour', 'Wallpapers']) {
      expect(screen.getByRole('region', { name: part })).toBeInTheDocument();
    }
  });

  it('keeps Gilroy for the wordmark alone, and names every colour by its hex', () => {
    render(<BrandPage />);

    expect(screen.getByText('Wordmark only')).toBeInTheDocument();
    expect(screen.getByText('#0066FF')).toBeInTheDocument();
  });

  it('offers ten wallpapers at both sizes, and a pack of each', () => {
    render(<BrandPage />);

    const wallpapers = screen.getByRole('region', { name: 'Wallpapers' });

    expect(within(wallpapers).getAllByRole('link', { name: 'Desktop 4K' })).toHaveLength(10);
    expect(within(wallpapers).getAllByRole('link', { name: 'Phone 4K' })).toHaveLength(10);
    expect(within(wallpapers).getByRole('link', { name: 'Desktop pack' })).toHaveAttribute(
      'href',
      '/brand/valence-wallpapers-desktop.zip',
    );
    expect(within(wallpapers).getByRole('link', { name: 'Phone pack' })).toHaveAttribute(
      'href',
      '/brand/valence-wallpapers-phone.zip',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BrandPage.displayName).toBe('BrandPage');
  });
});
