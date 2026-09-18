import { describe, expect, it } from 'vitest';
import { bytesPerHour } from './bytesPerHour';

describe('bytesPerHour', () => {
  it('turns a bitrate into what an hour of it costs', () => {
    expect(bytesPerHour(320)).toBe(144_000_000);
  });

  it('costs nothing for no stream at all', () => {
    expect(bytesPerHour(0)).toBe(0);
    expect(bytesPerHour(-5)).toBe(0);
  });
});
