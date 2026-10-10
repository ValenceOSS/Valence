import { afterEach, describe, expect, it, vi } from 'vitest';
import { PRE_TRANSCODING_DEFAULTS } from '@ValenceContracts/schemas/PreTranscoding';
import { savePreTranscoding } from './savePreTranscoding';

const status = {
  settings: { ...PRE_TRANSCODING_DEFAULTS, isEnabled: true },
  copiesMade: 0,
  stillNeeded: 3,
  givenUp: 0,
  ladder: [],
  current: null,
  isInWindow: true,
  timezone: 'UTC',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('savePreTranscoding', () => {
  it('sends the settings whole and reads back what was saved', async () => {
    const fetching = vi.fn().mockResolvedValue(new Response(JSON.stringify(status)));

    vi.stubGlobal('fetch', fetching);

    await expect(savePreTranscoding(status.settings)).resolves.toEqual(status);
    expect(fetching).toHaveBeenCalledWith(
      '/api/pre-transcoding',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(status.settings) }),
    );
  });

  it('answers nothing where the server would not take them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })));

    await expect(savePreTranscoding(status.settings)).resolves.toBeNull();
  });

  it('answers nothing where the server could not be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(savePreTranscoding(status.settings)).resolves.toBeNull();
  });
});
