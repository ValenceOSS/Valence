import { describe, expect, it } from 'vitest';
import { describeSizeAnHour } from './describeSizeAnHour';

describe('describeSizeAnHour', () => {
  it('says megabytes below a gigabyte, and gigabytes above', () => {
    expect(describeSizeAnHour(750)).toBe('750 MB an hour');
    expect(describeSizeAnHour(6000)).toBe('5.9 GB an hour');
  });
});
