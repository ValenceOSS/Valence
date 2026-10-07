import { render, screen } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { describe, expect, it } from 'vitest';
import { DuoFold } from './DuoFold';

const OPEN = {
  frame: '/duo/frame-open.webp',
  width: 1000,
  height: 700,
  screen: { left: 40, top: 40, width: 920, height: 620, radius: 20 },
  body: { left: 20, top: 20, width: 960, height: 660 },
};

const FOLDED = {
  frame: '/duo/frame-folded.webp',
  width: 600,
  height: 800,
  screen: { left: 80, top: 60, width: 440, height: 680, radius: 40 },
  body: { left: 60, top: 40, width: 480, height: 720 },
};

const folding = (openness: number) =>
  render(
    <DuoFold
      open={OPEN}
      folded={FOLDED}
      foldedScreen="/duo/folded.webp"
      still="/still.jpg"
      openness={motionValue(openness)}
    >
      <p>Playing</p>
    </DuoFold>,
  );

describe('DuoFold', () => {
  it('shows what it is given while it lies flat', () => {
    folding(1);

    expect(screen.getByText('Playing')).toBeInTheDocument();
  });

  it('cuts itself at the hinge into stills, with the folded Duo on the back, once it starts to close', () => {
    const { container } = folding(0.4);

    expect(screen.queryByText('Playing')).toBeNull();
    expect(container.querySelectorAll('img[src="/still.jpg"]')).toHaveLength(2);
    expect(container.querySelector('img[src="/duo/folded.webp"]')).not.toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DuoFold.displayName).toBe('DuoFold');
  });
});
