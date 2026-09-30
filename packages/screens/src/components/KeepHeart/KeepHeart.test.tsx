import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KeepHeart } from './KeepHeart';

describe('KeepHeart', () => {
  it('draws one heart, with no ring, for something not kept', () => {
    const { container } = render(<KeepHeart isKept={false} size={18} />);

    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(container.querySelector('.rounded-full')).toBeNull();
  });

  it('throws off a ring as something is kept', () => {
    const { container, rerender } = render(<KeepHeart isKept={false} size={18} />);

    rerender(<KeepHeart isKept size={18} />);

    expect(container.querySelector('.rounded-full')).not.toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(KeepHeart.displayName).toBe('KeepHeart');
  });
});
