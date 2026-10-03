import { describe, expect, it } from 'vitest';
import { pseudonymOf } from './pseudonymOf';

describe('pseudonymOf', () => {
  it('names a person the same way to one server every time', () => {
    expect(pseudonymOf('secret', 'films', 'sam')).toBe(pseudonymOf('secret', 'films', 'sam'));
    expect(pseudonymOf('secret', 'films', 'sam').length).toBeLessThanOrEqual(64);
  });

  it('names them differently to another server, for another secret, and another person', () => {
    const sam = pseudonymOf('secret', 'films', 'sam');

    expect(pseudonymOf('secret', 'music', 'sam')).not.toBe(sam);
    expect(pseudonymOf('another', 'films', 'sam')).not.toBe(sam);
    expect(pseudonymOf('secret', 'films', 'kai')).not.toBe(sam);
    expect(sam).not.toContain('sam');
  });
});
