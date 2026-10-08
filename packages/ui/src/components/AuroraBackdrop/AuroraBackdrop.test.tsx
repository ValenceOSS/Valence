import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AuroraBackdrop } from './AuroraBackdrop';

afterEach(() => {
  delete document.documentElement.dataset.graphics;
});

describe('AuroraBackdrop', () => {
  it('draws the moving light behind whatever holds it', () => {
    render(<AuroraBackdrop />);

    expect(screen.getByTestId('shader-mount')).toHaveClass('absolute', 'inset-0', '-z-10');
  });

  it('writes the light out as characters over a blurred copy drawn with fewer pixels', () => {
    render(<AuroraBackdrop isAscii />);

    const [glow, characters] = screen.getAllByTestId('shader-mount');

    expect(glow).toHaveClass('blur-xl');
    expect(characters).toHaveClass('mix-blend-screen');
    expect(Number(glow?.dataset.maxPixels)).toBeLessThan(Number(characters?.dataset.maxPixels));
  });

  it('leaves the light out where the page is drawn without a graphics card', () => {
    document.documentElement.dataset.graphics = 'software';

    render(<AuroraBackdrop />);

    expect(screen.queryByTestId('shader-mount')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AuroraBackdrop.displayName).toBe('AuroraBackdrop');
  });
});
