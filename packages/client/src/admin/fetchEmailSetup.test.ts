import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchEmailSetup } from './fetchEmailSetup';

const SETUP = {
  isEnabled: true,
  host: 'smtp.resend.com',
  port: 465,
  security: 'tls',
  username: 'resend',
  hasPassword: true,
  fromName: 'Valence',
  fromAddress: 'valence@example.com',
  sendsPasswordResets: true,
  sendsSetupLinks: false,
  isFromEnvironment: false,
  recent: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchEmailSetup', () => {
  it('reads the email setup from the admin endpoint', async () => {
    const fetching = vi.fn().mockResolvedValue(new Response(JSON.stringify(SETUP)));

    vi.stubGlobal('fetch', fetching);

    await expect(fetchEmailSetup()).resolves.toEqual(SETUP);
    expect(fetching).toHaveBeenCalledWith('/api/admin/email', expect.anything());
  });

  it('throws where the server refused', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));

    await expect(fetchEmailSetup()).rejects.toThrow();
  });
});
