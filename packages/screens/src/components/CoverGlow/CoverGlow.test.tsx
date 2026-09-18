import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CoverGlow } from './CoverGlow';

describe('CoverGlow', () => {
  it('lights with the cover it is given', () => {
    const { container } = render(<CoverGlow src="/cover.webp" className="absolute inset-0" />);

    expect(container.querySelector('img')).toHaveAttribute('src', '/cover.webp');
  });

  it('leaves only the dark without a cover', () => {
    const { container } = render(<CoverGlow src={null} />);

    expect(container.querySelector('img')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CoverGlow.displayName).toBe('CoverGlow');
  });
});
