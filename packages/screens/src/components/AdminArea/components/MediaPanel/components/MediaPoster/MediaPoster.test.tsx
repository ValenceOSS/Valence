import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MediaPoster } from './MediaPoster';

describe('MediaPoster', () => {
  it('shows the picture it is given', () => {
    const { container } = render(<MediaPoster src="/api/media/media-1/image/poster" />);

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/api/media/media-1/image/poster',
    );
  });

  it('draws an album’s cover square rather than tall', () => {
    const { container } = render(<MediaPoster src="/cover" isSquare />);

    expect(container.firstElementChild).toHaveClass('aspect-square');
  });

  it('says there is no artwork where there is none', () => {
    render(<MediaPoster src={null} />);

    expect(screen.getByLabelText('No artwork')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MediaPoster.displayName).toBe('MediaPoster');
  });
});
