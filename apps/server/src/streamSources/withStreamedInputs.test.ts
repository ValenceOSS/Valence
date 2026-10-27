import { describe, expect, it, vi } from 'vitest';
import { aTranscoder } from '@ValenceServer/testing/aTranscoder';
import type { SessionSpec } from '@ValenceServer/transcoder/TranscoderClient';
import { withStreamedInputs } from './withStreamedInputs';

const LINK = {
  key: 'streamed-abc',
  url: 'https://eu1.files.example.test/a',
  hosts: ['*.files.example.test'],
  sizeBytes: 10,
  expiresAt: null,
  pluginId: 'example-files',
  sourceId: 'files',
};

const A_FILE = {
  body: new ReadableStream<Uint8Array>(),
  contentType: 'video/mp4',
  status: 200,
  contentRange: null,
  contentLength: '10',
};

const build = (read = vi.fn(() => Promise.resolve<typeof A_FILE | 'expired' | null>(A_FILE))) => {
  const inner = {
    probe: vi.fn(() => Promise.reject(new Error('not a file'))),
    probeRemote: vi.fn(() => Promise.reject(new Error('probed'))),
    startSession: vi.fn(() => Promise.reject(new Error('started'))),
    readFile: vi.fn(() => Promise.resolve(null)),
  };
  const linkFor = vi.fn(() => Promise.resolve(LINK));
  const transcoder = withStreamedInputs(aTranscoder(inner), {
    itemOfPath: (path) => Promise.resolve(path === 'streamed://film/603' ? 'm1' : null),
    fileNameOf: () => Promise.resolve('film.mkv'),
    links: { linkFor },
    read,
  });

  return { transcoder, inner, linkFor, read };
};

describe('a transcoder that reaches streamed films', () => {
  it('probes a streamed film as its remote input, and a file as itself', async () => {
    const { transcoder, inner } = build();

    await transcoder.probe('streamed://film/603').catch(() => null);
    await transcoder.probe('/media/film.mkv').catch(() => null);

    expect(inner.probeRemote).toHaveBeenCalledWith('streamed-abc');
    expect(inner.probe).toHaveBeenCalledWith('/media/film.mkv');
  });

  it('starts a session on a streamed film’s remote input', async () => {
    const { transcoder, inner } = build();
    const spec: SessionSpec = {
      inputPath: 'streamed://film/603',
      startSeconds: 0,
      segmentSeconds: 4,
      hardwareAccel: 'none',
      video: { kind: 'copy' },
      audio: { kind: 'copy' },
    };

    await transcoder.startSession(spec).catch(() => null);

    expect(inner.startSession).toHaveBeenCalledWith(
      { ...spec, inputPath: { remote: 'streamed-abc' } },
      undefined,
      undefined,
    );
  });

  it('reads a streamed film from its source, asking for a fresh link once when it has expired', async () => {
    const read = vi.fn().mockResolvedValueOnce('expired').mockResolvedValueOnce(A_FILE);
    const { transcoder, linkFor } = build(read);

    expect(await transcoder.readFile('streamed://film/603', 'bytes=0-')).toBe(A_FILE);
    expect(linkFor).toHaveBeenLastCalledWith('m1', true);
    expect(read).toHaveBeenCalledWith({ ...LINK, fileName: 'film.mkv' }, 'bytes=0-', {
      devHosts: new Map(),
    });
  });

  it('refuses a streamed film nobody knows', async () => {
    const { transcoder } = build();

    await expect(transcoder.probe('streamed://film/604')).rejects.toThrow('no longer known');
  });
});
