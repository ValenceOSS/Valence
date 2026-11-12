import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeckFace } from './DeckFace';

const FACE = { cx: 115, apex: 196, radius: 131, half: 0.47, isSmile: true };

describe('DeckFace', () => {
  it('draws the arc as a ring cut to its span, with a round cap at each end', () => {
    const { container } = render(<DeckFace face={FACE} thickness={25} opacity={1} />);
    const box = container.firstElementChild;

    expect(box?.children).toHaveLength(3);
    expect(box?.querySelectorAll('.rounded-full')).toHaveLength(2);
  });

  it('paints in the ground colour, so it reads as a hole through the card', () => {
    const { container } = render(<DeckFace face={FACE} thickness={25} opacity={1} />);

    for (const part of container.firstElementChild?.children ?? []) {
      expect(part).toHaveClass('bg-surface');
    }
  });

  it('fades in by the opacity it is given', () => {
    const { container } = render(<DeckFace face={FACE} thickness={25} opacity={0.4} />);

    expect(container.firstElementChild).toHaveStyle({ opacity: '0.4' });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DeckFace.displayName).toBe('DeckFace');
  });
});
