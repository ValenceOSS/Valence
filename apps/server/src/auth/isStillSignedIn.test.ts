import { describe, expect, it, vi } from 'vitest';
import { isStillSignedIn } from './isStillSignedIn';

const signedInAs = (userId: string) => ({
  user: { id: userId },
  session: { id: 'session-1' },
});

describe('isStillSignedIn', () => {
  it('says so while the same account is still signed in', async () => {
    const getSession = vi.fn().mockResolvedValue(signedInAs('ada'));

    await expect(isStillSignedIn({ api: { getSession } }, new Headers(), 'ada')).resolves.toBe(
      true,
    );
  });

  it('asks afresh every time rather than trusting what was read at the start', async () => {
    const getSession = vi.fn().mockResolvedValueOnce(signedInAs('ada')).mockResolvedValueOnce(null);
    const headers = new Headers({ cookie: 'session=abc' });

    await expect(isStillSignedIn({ api: { getSession } }, headers, 'ada')).resolves.toBe(true);
    await expect(isStillSignedIn({ api: { getSession } }, headers, 'ada')).resolves.toBe(false);
    expect(getSession).toHaveBeenCalledTimes(2);
  });

  it('reads the session without sliding its expiry', async () => {
    const getSession = vi.fn().mockResolvedValue(signedInAs('ada'));
    const headers = new Headers({ cookie: 'session=abc' });

    await isStillSignedIn({ api: { getSession } }, headers, 'ada');

    expect(getSession).toHaveBeenCalledWith({ headers, query: { disableRefresh: true } });
  });

  it('says not once the sign-in has ended, expired or been revoked', async () => {
    const getSession = vi.fn().mockResolvedValue(null);

    await expect(isStillSignedIn({ api: { getSession } }, new Headers(), 'ada')).resolves.toBe(
      false,
    );
  });

  it('says not where what it carries now signs in somebody else', async () => {
    const getSession = vi.fn().mockResolvedValue(signedInAs('grace'));

    await expect(isStillSignedIn({ api: { getSession } }, new Headers(), 'ada')).resolves.toBe(
      false,
    );
  });

  it('keeps the benefit of the doubt where the sign-in could not be read at all', async () => {
    const getSession = vi.fn().mockRejectedValue(new Error('the database is busy'));

    await expect(isStillSignedIn({ api: { getSession } }, new Headers(), 'ada')).resolves.toBe(
      true,
    );
  });
});
