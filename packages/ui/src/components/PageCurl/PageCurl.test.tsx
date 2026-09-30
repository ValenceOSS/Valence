import { act, render, screen } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { describe, expect, it } from 'vitest';
import { PageCurl } from './PageCurl';

const leaf = { x: 0, y: 0, width: 100, height: 160, spine: 'left' as const };

const corner = { x: 100, y: 0 };

const draw = (at: { x: number; y: number }, isBackFacing = false) => {
  const x = motionValue(at.x);
  const y = motionValue(at.y);

  render(
    <PageCurl
      leaf={leaf}
      corner={corner}
      x={x}
      y={y}
      under={<p>Next page</p>}
      front={<p>This page</p>}
      back={<p>Its reverse</p>}
      isBackFacing={isBackFacing}
    />,
  );

  return { x, y };
};

const layerOf = (text: string): HTMLElement | null => screen.getByText(text).parentElement;

describe('PageCurl', () => {
  it('draws the page underneath, the page itself and the back of the fold', () => {
    draw(corner);

    expect(screen.getByText('Next page')).toBeInTheDocument();
    expect(screen.getByText('This page')).toBeInTheDocument();
    expect(screen.getByText('Its reverse')).toBeInTheDocument();
  });

  it('lies flat while the corner has not moved', () => {
    draw(corner);

    expect(layerOf('This page')?.style.clipPath).toBe('none');
  });

  it('cuts the page along the fold and lays the flap over it as the corner is pulled', () => {
    draw({ x: 60, y: 0 });

    expect(layerOf('This page')?.style.clipPath).toMatch(/^polygon\(/);
    expect(layerOf('Its reverse')?.style.transform).toMatch(/^matrix\(/);
  });

  it('repaints as the corner moves without drawing the page again', () => {
    const { x } = draw(corner);

    act(() => {
      x.set(40);
    });

    expect(layerOf('This page')?.style.clipPath).toMatch(/^polygon\(/);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PageCurl.displayName).toBe('PageCurl');
  });
});
