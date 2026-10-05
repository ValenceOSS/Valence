import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dusk } from './Dusk';

describe('Dusk', () => {
  it('flattens the standard-range version, and lets the high-range sun glow', () => {
    const flat = render(<Dusk isFlat glow={1} />).container.firstElementChild;
    const kept = render(<Dusk isFlat={false} glow={1} />).container.firstElementChild;

    expect(flat).toHaveClass('saturate-[0.35]');
    expect(kept).not.toHaveClass('saturate-[0.35]');
    expect(kept?.querySelector<HTMLElement>('.rounded-full')?.style.boxShadow).not.toBe('none');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Dusk.displayName).toBe('Dusk');
  });
});
