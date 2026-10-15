import { describe, expect, it } from 'vitest';
import { KBPS_IN_A_MBPS } from './KBPS_IN_A_MBPS';

describe('KBPS_IN_A_MBPS', () => {
  it('is how many kilobits make a megabit', () => {
    expect(KBPS_IN_A_MBPS).toBe(1000);
  });
});
