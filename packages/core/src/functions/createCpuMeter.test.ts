import { describe, expect, it } from 'vitest';
import { createCpuMeter } from './createCpuMeter';

/**
 * A meter over readings and clock times a test hands it in turn.
 *
 * @param readings - The processor time at each reading, in microseconds.
 * @param times - The clock at each reading, in milliseconds.
 * @returns The meter.
 */
const aMeter = (readings: number[], times: number[]) => {
  let at = 0;

  return createCpuMeter({
    read: () => readings[at] ?? 0,
    now: () => {
      const time = times[at] ?? 0;

      at += 1;

      return time;
    },
  });
};

describe('createCpuMeter', () => {
  it('says nothing on the first reading, having nothing to compare it with', async () => {
    await expect(aMeter([5_000_000], [0])()).resolves.toBeNull();
  });

  it('reads the share of one core used since the reading before', async () => {
    const meter = aMeter([1_000_000, 4_000_000, 4_500_000], [0, 2000, 3000]);

    await meter();

    await expect(meter()).resolves.toBe(150);
    await expect(meter()).resolves.toBe(50);
  });

  it('says nothing where the count went backwards or no time passed', async () => {
    const meter = aMeter([9_000_000, 1_000, 2_000], [0, 1000, 1000]);

    await meter();

    await expect(meter()).resolves.toBeNull();
    await expect(meter()).resolves.toBeNull();
  });
});
