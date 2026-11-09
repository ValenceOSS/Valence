import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TruncatedText } from './TruncatedText';

const NAME = 'A rather long name for a device';

/**
 * Makes every element measure as given.
 *
 * @param scrollWidth - How wide the words are.
 * @param clientWidth - How much room there is for them.
 */
const measuring = (scrollWidth: number, clientWidth: number) => {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth);
};

/**
 * Rests the pointer on the words for longer than a tooltip waits before it appears.
 *
 * @returns Every tooltip showing afterwards.
 */
const restOnTheWords = async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  await user.hover(screen.getByText(NAME));
  act(() => {
    vi.advanceTimersByTime(1000);
  });

  return screen
    .queryAllByText(NAME)
    .map((found) => found.closest('[data-slot="tooltip-content"]'))
    .filter((found) => found !== null);
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('TruncatedText', () => {
  it('says the whole of itself in a tooltip where it has been cut short', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    measuring(300, 100);

    render(<TruncatedText text={NAME} />);

    expect(await restOnTheWords()).not.toHaveLength(0);
  });

  it('adds no tooltip where the words fit, since it would only repeat them', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    measuring(100, 100);

    render(<TruncatedText text={NAME} />);

    expect(await restOnTheWords()).toHaveLength(0);
  });

  it('ends in an ellipsis rather than wrapping where it runs out of room', () => {
    render(<TruncatedText text={NAME} className="text-sm" />);

    expect(screen.getByText(NAME)).toHaveClass('truncate', 'text-sm');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TruncatedText.displayName).toBe('TruncatedText');
  });
});
