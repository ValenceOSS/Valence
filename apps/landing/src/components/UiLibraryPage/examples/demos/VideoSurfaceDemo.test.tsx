import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoSurfaceDemo } from './VideoSurfaceDemo';

beforeEach(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'textTracks', {
    configurable: true,
    value: Object.assign([], { addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
});

describe('VideoSurfaceDemo', () => {
  it('draws the surface', () => {
    render(<VideoSurfaceDemo />);

    expect(screen.getByLabelText('A film, waiting to play')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(VideoSurfaceDemo.displayName).toBe('VideoSurfaceDemo');
  });
});
