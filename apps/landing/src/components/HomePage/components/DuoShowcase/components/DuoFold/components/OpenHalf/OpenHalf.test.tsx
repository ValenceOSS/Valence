import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OpenHalf } from './OpenHalf';

const OPEN = {
  frame: '/duo/frame-open.webp',
  width: 1000,
  height: 700,
  screen: { left: 40, top: 40, width: 920, height: 620, radius: 20 },
  body: { left: 20, top: 20, width: 960, height: 660 },
};

describe('OpenHalf', () => {
  it('lays the whole Duo out twice as wide and slides the right half into view', () => {
    const { container } = render(<OpenHalf side="right" open={OPEN} still="/still.jpg" />);

    expect(container.querySelector('.w-\\[200\\%\\]')).toHaveClass('-left-full');
    expect(container.querySelector('img[src="/still.jpg"]')).not.toBeNull();
  });

  it('keeps the left half where it is', () => {
    const { container } = render(<OpenHalf side="left" open={OPEN} still="/still.jpg" />);

    expect(container.querySelector('.w-\\[200\\%\\]')).toHaveClass('left-0');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(OpenHalf.displayName).toBe('OpenHalf');
  });
});
