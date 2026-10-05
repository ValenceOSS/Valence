import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadVerified } from './downloadVerified';

const URL = 'https://addons.example/ublock_origin-1.75.0.xpi';

const FILE = Buffer.from('the pinned file');

const SHA256 = createHash('sha256').update(FILE).digest('hex');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('downloadVerified', () => {
  it('hands back a file that matches its pin', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(FILE)));

    expect(await downloadVerified(URL, SHA256)).toEqual(FILE);
  });

  it('refuses a file that does not match its pin', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('another file')));

    await expect(downloadVerified(URL, SHA256)).rejects.toThrow(/is not the file pinned/u);
  });

  it('refuses a download the server turned down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(downloadVerified(URL, SHA256)).rejects.toThrow(/answered 404/u);
  });
});
