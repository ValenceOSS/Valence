import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSubtitleFinding } from './readSubtitleFinding';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readSubtitleFinding', () => {
  it('asks the server about the title, and reads what it says', async () => {
    const answer = { state: 'notAllowed', sites: [], languages: [], server: 'Films' };
    const asked = vi.fn(() => Promise.resolve(Response.json(answer)));

    vi.stubGlobal('fetch', asked);

    await expect(readSubtitleFinding('m1')).resolves.toEqual(answer);
    expect(String(asked.mock.calls[0]?.at(0))).toContain('/api/media/m1/subtitles/finding');
  });
});
