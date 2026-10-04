import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArtworkTile } from './ArtworkTile';

describe('ArtworkTile', () => {
  it('draws the picture, noting its language, and says when it is chosen', () => {
    const { rerender } = render(
      <ArtworkTile
        kind="poster"
        label="Use poster 1, English"
        previewUrl="https://image.tmdb.org/t/p/w342/p.jpg"
        note="English"
        isChosen={false}
        isBusy={false}
        onChoose={vi.fn()}
      />,
    );

    expect(screen.getByText('English')).toBeInTheDocument();

    rerender(
      <ArtworkTile
        kind="poster"
        label="Use poster 1, English"
        previewUrl="https://image.tmdb.org/t/p/w342/p.jpg"
        note="English"
        isChosen
        isBusy={false}
        onChoose={vi.fn()}
      />,
    );

    expect(screen.getByText('Chosen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use poster 1, English' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('stands for the catalogue’s own pick when it has no picture', () => {
    render(
      <ArtworkTile
        kind="logo"
        label="Use the default logo"
        previewUrl={null}
        note="Automatic"
        isChosen={false}
        isBusy={false}
        onChoose={vi.fn()}
      />,
    );

    expect(screen.getByText('Catalogue default')).toBeInTheDocument();
  });

  it('is told when it is chosen, and shows it is working', async () => {
    const onChoose = vi.fn();

    render(
      <ArtworkTile
        kind="backdrop"
        label="Use backdrop 1, No text"
        previewUrl="https://image.tmdb.org/t/p/w780/b.jpg"
        note="No text"
        isChosen={false}
        isBusy
        onChoose={onChoose}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Use backdrop 1, No text' }));

    expect(onChoose).toHaveBeenCalled();
    expect(screen.getByRole('status', { name: 'Saving this artwork' })).toBeInTheDocument();
  });
});
