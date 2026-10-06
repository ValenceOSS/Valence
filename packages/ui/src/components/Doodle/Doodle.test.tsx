import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Doodle } from './Doodle';

describe('Doodle', () => {
  it('is drawn through a mask of its mark, out of the way of readers and the pointer', () => {
    const { container } = render(<Doodle of="underline" className="h-4 w-full" />);
    const mark = container.firstElementChild;

    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(mark).toHaveClass('pointer-events-none', 'bg-current', 'h-4', 'w-full');
    expect(mark?.getAttribute('style')).toMatch(/mask-image/u);
  });

  it('starts undrawn until it has been scrolled to', () => {
    const { container } = render(<Doodle of="circle" />);

    expect(container.firstElementChild?.getAttribute('style')).toMatch(/--drawn: 0%/u);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Doodle.displayName).toBe('Doodle');
  });
});
