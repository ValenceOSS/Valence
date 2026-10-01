import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { reportNowListening, reportNowReading } from './bookDevices';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<{ ok: boolean }>>();

beforeEach(() => {
  installPlatform(aFakePlatform({ thisClientId: () => 'this-tab' }));
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('bookDevices', () => {
  it('reports the audiobook this device is playing, as this device', async () => {
    await expect(reportNowListening(null)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/books/now-listening',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ clientId: 'this-tab', nowListening: null }),
      }),
    );
  });

  it('reports the book this device has open, as this device', async () => {
    const nowReading = { bookId: 'book-1', fraction: 0.5, pageNumber: null, reportedAtMs: 1 };

    await reportNowReading(nowReading);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/books/now-reading',
      expect.objectContaining({ body: JSON.stringify({ clientId: 'this-tab', nowReading }) }),
    );
  });

  it('says a report was not heard where the server could not be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(reportNowReading(null)).resolves.toBe(false);
  });
});
