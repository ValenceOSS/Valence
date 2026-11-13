import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PictureFramerDemo } from './PictureFramerDemo';

Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 100 });
Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  get: () => 100,
});

describe('PictureFramerDemo', () => {
  it('draws the picture to place, and the square it makes', () => {
    const { container } = render(<PictureFramerDemo />);

    expect(screen.getByRole('group', { name: 'Where the picture sits' })).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(3);

    fireEvent.keyDown(screen.getByRole('group'), { key: 'ArrowLeft' });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PictureFramerDemo.displayName).toBe('PictureFramerDemo');
  });
});
