import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LikedCover } from './LikedCover';

describe('LikedCover', () => {
  it('draws a heart on a plain square', () => {
    const { container } = render(<LikedCover className="size-20" />);

    expect(container.firstElementChild).toHaveClass('aspect-square', 'size-20');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LikedCover.displayName).toBe('LikedCover');
  });
});
