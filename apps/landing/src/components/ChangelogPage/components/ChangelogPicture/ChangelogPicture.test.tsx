import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChangelogPicture } from './ChangelogPicture';

const PICTURE = { src: '/changelog/music.png', alt: 'An album page' };

describe('ChangelogPicture', () => {
  it('draws the picture with its description, fetched at once where it leads the page', () => {
    render(<ChangelogPicture picture={PICTURE} isEager />);

    const image = screen.getByRole('img', { name: 'An album page' });

    expect(image).toHaveAttribute('src', '/changelog/music.png');
    expect(image).toHaveAttribute('loading', 'eager');
  });

  it('waits to fetch one further down the page', () => {
    render(<ChangelogPicture picture={PICTURE} />);

    expect(screen.getByRole('img', { name: 'An album page' })).toHaveAttribute('loading', 'lazy');
  });

  it('leaves itself out where the picture cannot be read', () => {
    render(<ChangelogPicture picture={PICTURE} />);

    fireEvent.error(screen.getByRole('img', { name: 'An album page' }));

    expect(screen.queryByRole('img', { name: 'An album page' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ChangelogPicture.displayName).toBe('ChangelogPicture');
  });
});
