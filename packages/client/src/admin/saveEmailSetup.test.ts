import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveEmailSetup } from './saveEmailSetup';

const CHANGE = {
  isEnabled: true,
  host: 'smtp.example.com',
  port: 587,
  security: 'starttls',
  username: 'me',
  password: '',
  fromName: 'Valence',
  fromAddress: 'valence@example.com',
  sendsPasswordResets: true,
  sendsSetupLinks: true,
} as const;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveEmailSetup', () => {
  it('puts the change and answers with what was saved', async () => {
    const saved = {
      isEnabled: true,
      host: 'smtp.example.com',
      port: 587,
      security: 'starttls',
      username: 'me',
      hasPassword: true,
      fromName: 'Valence',
      fromAddress: 'valence@example.com',
      sendsPasswordResets: true,
      sendsSetupLinks: true,
      isFromEnvironment: false,
      recent: [],
    };
    const fetching = vi.fn().mockResolvedValue(new Response(JSON.stringify(saved)));

    vi.stubGlobal('fetch', fetching);

    await expect(saveEmailSetup(CHANGE)).resolves.toEqual(saved);
    expect(fetching).toHaveBeenCalledWith(
      '/api/admin/email',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(CHANGE) }),
    );
  });

  it('answers nothing where the server refused or could not be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));

    await expect(saveEmailSetup(CHANGE)).resolves.toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(saveEmailSetup(CHANGE)).resolves.toBeNull();
  });
});
