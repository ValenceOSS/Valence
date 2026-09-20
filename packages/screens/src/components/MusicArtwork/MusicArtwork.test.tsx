import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MusicArtwork } from './MusicArtwork';

describe('MusicArtwork', () => {
  it('draws the picture, named for anybody not looking at it', () => {
    render(<MusicArtwork src="/cover.webp" label="Even In Arcadia" />);

    expect(screen.getByRole('img', { name: 'Even In Arcadia' })).toHaveAttribute(
      'src',
      '/cover.webp',
    );
  });

  it('shows the note until the picture has loaded, then only the picture', () => {
    const { container } = render(<MusicArtwork src="/slow.webp" label="Slow" />);
    const picture = screen.getByRole('img', { name: 'Slow' });

    expect(picture).toHaveClass('opacity-0');
    expect(container.querySelector('svg')).not.toBeNull();

    fireEvent.load(picture);

    expect(picture).toHaveClass('opacity-100');
    expect(container.querySelector('svg')).toBeNull();
  });

  it('stands a note in where there is no picture, still saying what it is', () => {
    render(<MusicArtwork src={null} label="Untitled" />);

    expect(screen.queryByRole('img', { name: 'Untitled' })).not.toBeInTheDocument();
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('stands the note in where the picture will not load', () => {
    render(<MusicArtwork src="/broken.webp" label="Broken" />);

    fireEvent.error(screen.getByRole('img', { name: 'Broken' }));

    expect(screen.queryByRole('img', { name: 'Broken' })).not.toBeInTheDocument();
  });

  it('draws a person round', () => {
    const { container } = render(<MusicArtwork src={null} label="Artist" shape="round" />);

    expect(container.firstElementChild).toHaveClass('rounded-full');
  });

  it('stands a lifted cover off the page on a shadow, and lays a plain one flat', () => {
    const { container, rerender } = render(<MusicArtwork src={null} label="Album" />);

    expect(container.firstElementChild).not.toHaveClass('shadow-[var(--shadow-artwork)]');

    rerender(<MusicArtwork src={null} label="Album" isLifted />);

    expect(container.firstElementChild).toHaveClass('shadow-[var(--shadow-artwork)]');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicArtwork.displayName).toBe('MusicArtwork');
  });
});
