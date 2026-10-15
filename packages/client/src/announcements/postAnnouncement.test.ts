import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { postAnnouncement } from './postAnnouncement';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<{ ok: boolean }>>();

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('postAnnouncement', () => {
  it('puts an announcement up', async () => {
    const draft = { text: 'Back at six', severity: 'info' as const, endsAt: null };

    await expect(postAnnouncement(draft)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/announcement',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(draft) }),
    );
  });

  it('takes the announcement down when given nothing', async () => {
    await postAnnouncement(null);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/announcement',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('says so when the server refuses or cannot be reached', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });
    await expect(postAnnouncement(null)).resolves.toBe(false);

    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(postAnnouncement(null)).resolves.toBe(false);
  });
});
