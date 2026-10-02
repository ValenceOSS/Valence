import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendTestEmail } from './sendTestEmail';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendTestEmail', () => {
  it('asks for a test to the address and answers how it went', async () => {
    const answer = { sent: false, problem: { code: null, message: 'No', values: {} } };
    const fetching = vi.fn().mockResolvedValue(new Response(JSON.stringify(answer)));

    vi.stubGlobal('fetch', fetching);

    await expect(sendTestEmail('ada@example.com')).resolves.toEqual(answer);
    expect(fetching).toHaveBeenCalledWith(
      '/api/admin/email/test',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ to: 'ada@example.com' }) }),
    );
  });

  it('answers nothing where the server refused', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));

    await expect(sendTestEmail('ada@example.com')).resolves.toBeNull();
  });
});
