import { describe, expect, it } from 'vitest';
import { setupStateOf } from './setupStateOf';

const NOW = new Date(Date.UTC(2026, 9, 2));

describe('setupStateOf', () => {
  it('is waiting while the link is unused and in date', () => {
    expect(setupStateOf({ expiresAt: new Date(Date.UTC(2026, 9, 3)), usedAt: null }, NOW)).toBe(
      'waiting',
    );
  });

  it('has expired once the date has passed unused', () => {
    expect(setupStateOf({ expiresAt: new Date(Date.UTC(2026, 9, 1)), usedAt: null }, NOW)).toBe(
      'expired',
    );
  });

  it('was used once it has been, whatever the date', () => {
    expect(
      setupStateOf({ expiresAt: new Date(Date.UTC(2026, 9, 1)), usedAt: new Date(0) }, NOW),
    ).toBe('used');
  });
});
