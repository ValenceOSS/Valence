import { afterEach, describe, expect, it, vi } from 'vitest';
import { reportPlaybackNote } from './reportPlaybackNote';

const note = {
  kind: 'recovered' as const,
  mediaId: 'media-1',
  sessionId: 'abc',
  atSeconds: 12,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('reportPlaybackNote', () => {
  it('tells the server what the player put right, naming the device', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));

    vi.stubGlobal('fetch', fetchMock);
    await reportPlaybackNote(note, 'tab 1');

    expect(fetchMock).toHaveBeenCalledWith('/api/playback/notes?clientId=tab%201', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(note),
    });
  });

  it('lets a note go where the server cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );

    await expect(reportPlaybackNote(note, 'tab-1')).resolves.toBeUndefined();
  });
});
