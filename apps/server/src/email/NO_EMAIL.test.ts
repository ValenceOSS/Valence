import { describe, expect, it } from 'vitest';
import { NO_EMAIL } from './NO_EMAIL';

describe('NO_EMAIL', () => {
  it('is off for everything and sends nothing', async () => {
    expect(await NO_EMAIL.isOn('setupLinks')).toBe(false);
    expect(await NO_EMAIL.isOn('passwordResets')).toBe(false);
    expect(
      await NO_EMAIL.sendSetupLink({
        to: 'ada@example.com',
        name: 'Ada',
        url: 'https://valence.example/setup/abc',
        expiresAt: new Date(),
        idempotencyKey: 'key',
      }),
    ).toEqual({ kind: 'off' });
    expect(
      await NO_EMAIL.sendPasswordReset({
        to: 'ada@example.com',
        name: 'Ada',
        url: 'https://valence.example/reset/abc',
        expiresAt: new Date(),
        idempotencyKey: 'key',
      }),
    ).toEqual({ kind: 'off' });
    expect(await NO_EMAIL.sendTest('ada@example.com')).toEqual({ kind: 'off' });
    expect(await NO_EMAIL.setup()).toMatchObject({
      isEnabled: false,
      hasPassword: false,
      recent: [],
    });
  });
});
