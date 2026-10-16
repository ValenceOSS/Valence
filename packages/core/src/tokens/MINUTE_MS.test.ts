import { describe, expect, it } from 'vitest';
import { MINUTE_MS } from './MINUTE_MS';

describe('MINUTE_MS', () => {
  it('is a minute in milliseconds', () => {
    expect(MINUTE_MS).toBe(60_000);
  });
});
