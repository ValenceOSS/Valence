import { render, screen } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { describe, expect, it } from 'vitest';
import { FannedPhone } from './FannedPhone';

const PHONE = {
  label: 'Now playing',
  turn: 0,
  lift: 0,
  spread: 0,
  finish: 'blue',
  src: '/phones/playing.jpg',
} as const;

describe('FannedPhone', () => {
  it('shows its screen, standing in front of the others when it is the middle one', () => {
    const { container } = render(<FannedPhone phone={PHONE} opened={motionValue(1)} />);

    expect(screen.getByRole('img', { name: 'Now playing' })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('z-20', 'scale-110');
  });

  it('glows with its own screen behind it', () => {
    const { container } = render(<FannedPhone phone={PHONE} opened={motionValue(1)} />);
    const glow = container.querySelector('img[aria-hidden="true"]');

    expect(glow).toHaveAttribute('src', '/phones/playing.jpg');
    expect(glow).toHaveClass('blur-3xl', 'opacity-70');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FannedPhone.displayName).toBe('FannedPhone');
  });
});
