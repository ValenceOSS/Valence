import { render } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { describe, expect, it } from 'vitest';
import { DoneMark } from './DoneMark';

describe('DoneMark', () => {
  it('turns the spinner before drawing the tick, hidden from anybody reading the toast', () => {
    const { container } = render(<DoneMark />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    expect(container.querySelector('.valence-draw svg')).not.toBeNull();
  });

  it('arrives already settled, with no spinner, where motion is reduced', () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <DoneMark />
      </MotionConfig>,
    );

    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.querySelector('.valence-draw svg')).not.toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DoneMark.displayName).toBe('DoneMark');
  });
});
