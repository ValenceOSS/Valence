import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WallpaperCard } from './WallpaperCard';

const TIDE = { id: 'tide', name: 'Tide', look: 'Wide teal ribbons' } as const;

describe('WallpaperCard', () => {
  it('names the wallpaper and says what makes it its own', () => {
    render(
      <ul>
        <WallpaperCard wallpaper={TIDE} />
      </ul>,
    );

    expect(screen.getByRole('heading', { name: 'Tide' })).toBeInTheDocument();
    expect(screen.getByText('Wide teal ribbons')).toBeInTheDocument();
  });

  it('saves each size under a name that says what it is', () => {
    render(
      <ul>
        <WallpaperCard wallpaper={TIDE} />
      </ul>,
    );

    expect(screen.getByRole('link', { name: '16:9' })).toHaveAttribute(
      'download',
      'Valence Tide - Desktop 16x9 3840x2160.jpg',
    );
    expect(screen.getByRole('link', { name: '16:10' })).toHaveAttribute(
      'href',
      '/brand/wallpapers/valence-tide-mac.jpg',
    );
    expect(screen.getByRole('link', { name: '21:9' })).toHaveAttribute(
      'href',
      '/brand/wallpapers/valence-tide-ultrawide.jpg',
    );
    expect(screen.getByRole('link', { name: 'Phone' })).toHaveAttribute(
      'href',
      '/brand/wallpapers/valence-tide-phone.jpg',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WallpaperCard.displayName).toBe('WallpaperCard');
  });
});
