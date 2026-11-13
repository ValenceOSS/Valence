import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TickMeter } from './TickMeter';

/**
 * Counts the lit ticks in a drawn meter.
 *
 * @param container - Where the meter was drawn.
 * @returns How many ticks are lit.
 */
const litTicks = (container: HTMLElement): number =>
  [...container.querySelectorAll('span[aria-hidden] > span > span')].filter((light) =>
    light.className.includes('opacity-100'),
  ).length;

describe('TickMeter', () => {
  it('draws the number of ticks asked for', () => {
    const { container } = render(<TickMeter fraction={0.5} ticks={10} />);

    expect(container.querySelectorAll('span[aria-hidden] > span')).toHaveLength(10);
  });

  it('lights the share of the ticks the fraction says', async () => {
    const { container } = render(<TickMeter fraction={0.5} ticks={10} />);

    await waitFor(() => {
      expect(litTicks(container)).toBe(5);
    });
  });

  it('lights one tick for any share above nothing', async () => {
    const { container } = render(<TickMeter fraction={0.001} ticks={20} />);

    await waitFor(() => {
      expect(litTicks(container)).toBe(1);
    });
  });

  it('lights nothing for nothing, and never more than every tick', async () => {
    const empty = render(<TickMeter fraction={0} ticks={8} />);
    const over = render(<TickMeter fraction={3} ticks={8} />);

    await waitFor(() => {
      expect(litTicks(over.container)).toBe(8);
    });
    expect(litTicks(empty.container)).toBe(0);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TickMeter.displayName).toBe('TickMeter');
  });
});
