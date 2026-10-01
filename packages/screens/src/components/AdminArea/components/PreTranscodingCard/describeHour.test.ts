import { describe, expect, it } from 'vitest';
import { describeHour } from './describeHour';

describe('describeHour', () => {
  it('shows an hour on a twenty-four hour clock', () => {
    expect([describeHour(1), describeHour(13), describeHour(0)]).toEqual([
      '01:00',
      '13:00',
      '00:00',
    ]);
  });
});
