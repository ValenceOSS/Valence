import { describe, expect, it } from 'vitest';
import { AccountSchema } from '@ValenceContracts/schemas/Account';
import { accountStandingOf } from './accountStandingOf';

const account = (changes: object) =>
  AccountSchema.parse({
    id: 'usr-1',
    name: 'Ada',
    email: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    isBanned: false,
    banReason: null,
    position: null,
    isAdministrator: false,
    face: null,
    roles: [],
    ...changes,
  });

describe('accountStandingOf', () => {
  it('is banned whatever else holds', () => {
    expect(accountStandingOf(account({ isBanned: true, canSignIn: false }))).toBe('banned');
  });

  it('is active once it can be signed in to, even with a reset link out', () => {
    expect(
      accountStandingOf(
        account({ setup: { state: 'waiting', expiresAt: '2026-10-09T00:00:00Z' } }),
      ),
    ).toBe('active');
  });

  it('is waiting for setup while its link works', () => {
    expect(
      accountStandingOf(
        account({
          canSignIn: false,
          setup: { state: 'waiting', expiresAt: '2026-10-09T00:00:00Z' },
        }),
      ),
    ).toBe('waiting');
  });

  it('says its link has run out', () => {
    expect(
      accountStandingOf(
        account({
          canSignIn: false,
          setup: { state: 'expired', expiresAt: '2026-10-01T00:00:00Z' },
        }),
      ),
    ).toBe('expired');
  });

  it('cannot be signed in to with no link at all', () => {
    expect(accountStandingOf(account({ canSignIn: false }))).toBe('cannotSignIn');
  });
});
