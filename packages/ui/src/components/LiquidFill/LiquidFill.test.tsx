import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LiquidFill } from './LiquidFill';

describe('LiquidFill', () => {
  it('draws onto a canvas that is hidden from assistive technology and takes no pointer', () => {
    const { container } = render(<LiquidFill level={0.4} tone="success" />);
    const canvas = container.querySelector('canvas');

    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(canvas).toHaveClass('pointer-events-none', 'absolute', 'inset-0');
  });

  it('takes the caller’s classes', () => {
    const { container } = render(<LiquidFill level={0.4} tone="danger" className="opacity-50" />);

    expect(container.querySelector('canvas')).toHaveClass('opacity-50');
  });

  it('keeps working as the level changes and goes away cleanly', () => {
    const { rerender, unmount, container } = render(<LiquidFill level={0.1} tone="success" />);

    rerender(<LiquidFill level={0.9} tone="warning" />);

    expect(container.querySelector('canvas')).toBeInTheDocument();
    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LiquidFill.displayName).toBe('LiquidFill');
  });
});
