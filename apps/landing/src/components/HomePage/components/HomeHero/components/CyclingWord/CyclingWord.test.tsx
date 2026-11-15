import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CyclingWord } from './CyclingWord';

const WORDS = ['films', 'shows', 'music'] as const;

/**
 * The word being shown, read letter by letter.
 */
const shown = (container: HTMLElement) => container.textContent;

describe('CyclingWord', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts on the first word', () => {
    const { container } = render(<CyclingWord words={WORDS} staysMs={2000} isStill={false} />);

    expect(shown(container)).toBe('films');
  });

  it('moves on to the next word after each stay, and back round to the first', () => {
    const { container } = render(<CyclingWord words={WORDS} staysMs={2000} isStill={false} />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(shown(container)).toContain('shows');

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(shown(container)).toContain('films');
  });

  it('keeps to the first word for somebody who asked for stillness', () => {
    render(<CyclingWord words={WORDS} staysMs={2000} isStill />);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.getByText('f')).toBeInTheDocument();
    expect(screen.queryByText('h')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CyclingWord.displayName).toBe('CyclingWord');
  });
});
