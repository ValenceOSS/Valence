import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MusicTile } from './MusicTile';

describe('MusicTile', () => {
  it('opens what it stands for', async () => {
    const onOpen = vi.fn();

    render(
      <MusicTile title="Even In Arcadia" detail="Sleep Token" artwork={null} onOpen={onOpen} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Even In Arcadia/ }));

    expect(onOpen).toHaveBeenCalled();
  });

  it('plays it straight away where it can be', async () => {
    const onPlay = vi.fn();

    render(
      <MusicTile
        title="Even In Arcadia"
        detail="Sleep Token"
        artwork={null}
        onOpen={vi.fn()}
        onPlay={onPlay}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Play Even In Arcadia' }));

    expect(onPlay).toHaveBeenCalled();
  });

  it('offers no play button for something that cannot be played from here', () => {
    render(<MusicTile title="Sleep Token" detail="Artist" artwork={null} onOpen={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Play Sleep Token' })).not.toBeInTheDocument();
  });

  it('says a line about it', () => {
    render(<MusicTile title="Album" detail="2025 · 10 songs" artwork={null} onOpen={vi.fn()} />);

    expect(screen.getByText('2025 · 10 songs')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicTile.displayName).toBe('MusicTile');
  });

  it('casts a round shadow under a round picture', () => {
    const { container } = render(
      <MusicTile
        title="Sleep Token"
        detail="Artist"
        artwork={<span />}
        onOpen={vi.fn()}
        shape="round"
      />,
    );

    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
  });
});
