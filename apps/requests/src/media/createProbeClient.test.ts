import { describe, expect, it, vi } from 'vitest';
import { createProbeClient } from './createProbeClient';

const FOUND = {
  video: { codec: 'hevc', width: 3840, height: 2160 },
  audioStreams: [{ codec: 'eac3', channels: 6, profile: null }],
};

describe('createProbeClient', () => {
  it('asks the transcoder what a file is', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(Response.json(FOUND)));
    const probe = createProbeClient('http://valence:8420', fetcher);

    expect(await probe('/media/Films/Dune (2021)/Dune (2021).mkv')).toMatchObject({
      video: { codec: 'hevc', height: 2160 },
    });

    const [address, sent] = fetcher.mock.calls[0] ?? [];

    expect(address).toBe('http://valence:8420/probe');
    const body = sent?.body;

    expect(sent?.method).toBe('POST');
    expect(typeof body).toBe('string');
    expect(JSON.parse(typeof body === 'string' ? body : '')).toEqual({
      path: '/media/Films/Dune (2021)/Dune (2021).mkv',
    });
  });

  it('asks nothing at all where no transcoder is set up', async () => {
    const fetcher = vi.fn<typeof fetch>();

    expect(await createProbeClient('', fetcher)('/media/Dune.mkv')).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('answers nothing where the transcoder will not read the file', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response('no', { status: 400 })));

    expect(await createProbeClient('http://valence:8420', fetcher)('/media/Dune.mkv')).toBeNull();
  });

  it('answers nothing where the transcoder cannot be reached at all', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.reject(new Error('offline')));

    expect(await createProbeClient('http://valence:8420', fetcher)('/media/Dune.mkv')).toBeNull();
  });

  it('answers nothing where what comes back is not a probe', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(Response.json({ video: 'yes' })));

    expect(await createProbeClient('http://valence:8420', fetcher)('/media/Dune.mkv')).toBeNull();
  });
});
