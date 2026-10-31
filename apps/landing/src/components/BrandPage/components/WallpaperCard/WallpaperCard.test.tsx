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

    expect(screen.getByRole('link', { name: 'Desktop 4K' })).toHaveAttribute(
      'download',
      'Valence Tide - Desktop 4K.jpg',
    );
    expect(screen.getByRole('link', { name: 'Phone 4K' })).toHaveAttribute(
      'href',
      '/brand/wallpapers/valence-tide-phone.jpg',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WallpaperCard.displayName).toBe('WallpaperCard');
  });
});
