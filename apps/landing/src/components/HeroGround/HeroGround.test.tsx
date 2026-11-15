import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeroGround } from './HeroGround';

describe('HeroGround', () => {
  it('fills the hero behind its words, hidden from assistive technology', () => {
    const { container } = render(<HeroGround />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild).toHaveClass('absolute', 'inset-0', '-z-10');
  });

  it('lays the mark, cropped large, over the field of characters', () => {
    const { container } = render(<HeroGround />);

    expect(container.querySelector('canvas')).toBeInTheDocument();
    expect(container.querySelector('.valence-hero-mark')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HeroGround.displayName).toBe('HeroGround');
  });
});
