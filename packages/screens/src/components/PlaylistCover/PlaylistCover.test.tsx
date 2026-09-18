import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlaylistCover } from './PlaylistCover';

const cover = (container: HTMLElement) => container.querySelectorAll('img');

describe('PlaylistCover', () => {
  it('is named for the playlist', () => {
    render(<PlaylistCover name="Sunday morning" albumIds={[]} />);

    expect(screen.getByRole('img', { name: 'Sunday morning' })).toBeInTheDocument();
  });

  it('draws one cover until there are four to make a grid of', () => {
    const { container } = render(<PlaylistCover name="Mix" albumIds={['a', 'b', 'c']} />);

    expect(cover(container)).toHaveLength(1);
  });

  it('draws four covers in a grid once there are four', () => {
    const { container } = render(<PlaylistCover name="Mix" albumIds={['a', 'b', 'c', 'd']} />);

    expect(cover(container)).toHaveLength(4);
  });

  it('draws no cover for an empty playlist', () => {
    const { container } = render(<PlaylistCover name="Empty" albumIds={[]} />);

    expect(cover(container)).toHaveLength(0);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PlaylistCover.displayName).toBe('PlaylistCover');
  });
});
