import { act, render, screen } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LivingRoom } from './LivingRoom';

/**
 * The addresses of the pictures on the television, the one leaving included.
 */
const onTheScreen = (container: HTMLElement) =>
  [...container.querySelectorAll('img[src^="/room/tv-"]')].map((picture) =>
    picture.getAttribute('src'),
  );

describe('LivingRoom', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('says what the television app is, over a picture of a living room', () => {
    render(<LivingRoom />);

    expect(
      screen.getAllByRole('heading', { name: /On the sofa, on your server/u }),
    ).not.toHaveLength(0);
    expect(
      screen.getByRole('img', { name: 'A living room at night, with Valence on the television' }),
    ).toBeInTheDocument();
  });

  it('shows the television app’s home on the television, taking turns between titles', () => {
    const { container } = render(<LivingRoom />);

    expect(onTheScreen(container)).toContain('/room/tv-1.jpg');
    expect(onTheScreen(container)).not.toContain('/room/tv-2.jpg');

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(onTheScreen(container)).toContain('/room/tv-2.jpg');
  });

  it('keeps to the first title for somebody who asked for less motion', () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <LivingRoom />
      </MotionConfig>,
    );

    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    expect(onTheScreen(container)).not.toContain('/room/tv-2.jpg');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LivingRoom.displayName).toBe('LivingRoom');
  });
});
