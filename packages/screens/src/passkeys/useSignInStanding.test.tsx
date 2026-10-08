import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { useSignInStanding } from './useSignInStanding';

const hasAPassword = vi.hoisted(() => vi.fn<() => Promise<boolean>>());
const listPasskeys = vi.hoisted(() => vi.fn<() => Promise<{ id: string }[]>>());

vi.mock('@ValenceClient/session/auth', () => ({
  hasAPassword,
  listPasskeys,
  fetchSession: vi.fn(),
}));

/**
 * Reads where the account stands, in a cache of its own.
 *
 * @returns The hook as rendered.
 */
const readIt = () => renderHook(() => useSignInStanding(), { wrapper: CacheScope });

beforeEach(() => {
  hasAPassword.mockReset().mockResolvedValue(true);
  listPasskeys.mockReset().mockResolvedValue([]);
});

describe('useSignInStanding', () => {
  it('says it is still reading until the server has answered', () => {
    const { result } = readIt();

    expect(result.current).toBe('reading');
  });

  it('says an account with a password may add a passkey', async () => {
    const { result } = readIt();

    await waitFor(() => {
      expect(result.current).toBe('mayAddAPasskey');
    });
  });

  it('says an account with a passkey has one', async () => {
    listPasskeys.mockResolvedValue([{ id: 'passkey-1' }]);

    const { result } = readIt();

    await waitFor(() => {
      expect(result.current).toBe('hasPasskey');
    });
  });

  it('says an account with neither needs a way in', async () => {
    hasAPassword.mockResolvedValue(false);

    const { result } = readIt();

    await waitFor(() => {
      expect(result.current).toBe('needsAWayIn');
    });
  });

  it('assumes a password where the server could not say', async () => {
    hasAPassword.mockRejectedValue(new Error('offline'));
    listPasskeys.mockRejectedValue(new Error('offline'));

    const { result } = readIt();

    await waitFor(() => {
      expect(result.current).toBe('mayAddAPasskey');
    });
  });
});
