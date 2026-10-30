import { act, fireEvent, render, screen } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POCKET_FEATURES } from './POCKET_FEATURES';
import { PocketSection } from './PocketSection';

const pressedTitle = () =>
  screen.getAllByRole('button').find((button) => button.getAttribute('aria-pressed') === 'true')
    ?.textContent ?? '';

describe('PocketSection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('says what the phone app is for, with the first part of it chosen and on the screen', () => {
    render(<PocketSection />);

    expect(screen.getByRole('heading', { name: /In your pocket/ })).toBeInTheDocument();
    expect(pressedTitle()).toContain(POCKET_FEATURES[0].title);
    expect(screen.getByRole('img', { name: POCKET_FEATURES[0].alt })).toBeInTheDocument();
  });

  it('walks on to the next part of the app on its own', () => {
    render(<PocketSection />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(pressedTitle()).toContain(POCKET_FEATURES[1].title);
  });

  it('shows whichever part is chosen', () => {
    render(<PocketSection />);

    fireEvent.click(screen.getByRole('button', { name: new RegExp(POCKET_FEATURES[3].title) }));

    expect(pressedTitle()).toContain(POCKET_FEATURES[3].title);
    expect(screen.getByRole('img', { name: POCKET_FEATURES[3].alt })).toBeInTheDocument();
  });

  it('holds still for somebody who asked for stillness', () => {
    render(
      <MotionConfig reducedMotion="always">
        <PocketSection />
      </MotionConfig>,
    );

    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(pressedTitle()).toContain(POCKET_FEATURES[0].title);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PocketSection.displayName).toBe('PocketSection');
  });
});
