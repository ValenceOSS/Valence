import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GradientAscii } from './GradientAscii';

afterEach(() => {
  vi.restoreAllMocks();
  delete document.documentElement.dataset.graphics;
});

describe('GradientAscii', () => {
  it('fills whatever holds it with a canvas hidden from assistive technology', () => {
    const { container } = render(<GradientAscii className="absolute inset-0" />);
    const holder = container.firstElementChild;

    expect(holder).toHaveAttribute('aria-hidden', 'true');
    expect(holder).toHaveClass('absolute', 'inset-0', 'h-full', 'w-full');
    expect(holder?.querySelector('canvas')).toBeInTheDocument();
  });

  it('comes and goes quietly where the browser has no WebGL 2', () => {
    const { unmount } = render(<GradientAscii />);

    expect(unmount).not.toThrow();
  });

  it('draws nothing where the page is drawn without a graphics card', () => {
    document.documentElement.dataset.graphics = 'software';

    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');

    render(<GradientAscii />);

    expect(getContext).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(GradientAscii.displayName).toBe('GradientAscii');
  });
});
