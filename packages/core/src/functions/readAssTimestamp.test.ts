import { describe, expect, it } from 'vitest';
import { readAssTimestamp } from './readAssTimestamp';

describe('readAssTimestamp', () => {
  it('reads centiseconds, which is all the format carries', () => {
    expect(readAssTimestamp('0:00:03.50')).toBe(3.5);
    expect(readAssTimestamp('1:02:03.04')).toBeCloseTo(3723.04, 5);
  });

  it('reads a single digit after the point as tenths', () => {
    expect(readAssTimestamp('0:00:01.5')).toBe(1.5);
  });

  it('reads thousandths, which some tools write', () => {
    expect(readAssTimestamp('0:00:01.250')).toBe(1.25);
  });

  it('reads a film longer than ten hours', () => {
    expect(readAssTimestamp('12:00:00.00')).toBe(43200);
  });

  it('reports nothing for a field that is not a time', () => {
    expect(readAssTimestamp('Default')).toBeNull();
    expect(readAssTimestamp('')).toBeNull();
  });
});
