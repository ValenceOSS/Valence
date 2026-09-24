import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { markWatched } from './markWatched';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<{ ok: boolean }>>();

beforeEach(() => {
  installPlatform(aFakePlatform());
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('markWatched', () => {
  it('records each as reached the end', async () => {
    await markWatched(
      [
        { id: 'e1', durationSeconds: 1500 },
        { id: 'e2', durationSeconds: 1400 },
      ],
      true,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/media/e1/progress');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'PUT' });
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      '{"positionSeconds":1500,"durationSeconds":1500,"isFinished":true}',
    );
  });

  it('forgets how far they got where it is marked unwatched', async () => {
    await markWatched([{ id: 'e1', durationSeconds: 1500 }], false);

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
  });

  it('says so where the server would not record one', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false });

    await expect(
      markWatched(
        [
          { id: 'e1', durationSeconds: 1 },
          { id: 'e2', durationSeconds: 1 },
        ],
        true,
      ),
    ).rejects.toThrow('It could not be marked as watched.');
  });
});
