import { zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { fetchSubdlSubtitle } from './fetchSubdlSubtitle';

const answeringWith = (zip: Uint8Array) => () => Promise.resolve(new Response(zip));

describe('fetchSubdlSubtitle', () => {
  it('reads the subtitle out of the zip, leaving every other entry alone', async () => {
    const zip = zipSync({
      'readme.nfo': new Uint8Array(1024 * 1024).fill(32),
      'Film.srt': new TextEncoder().encode('1\n00:00:01,000 --> 00:00:02,000\nHi\n'),
    });

    expect(await fetchSubdlSubtitle('/subtitle/1.zip', null, answeringWith(zip))).toEqual({
      kind: 'downloaded',
      bytes: new TextEncoder().encode('1\n00:00:01,000 --> 00:00:02,000\nHi\n'),
      extension: 'srt',
    });
  });

  it('counts only subtitles against what it will inflate, so a large file beside them takes nothing from them', async () => {
    const zip = zipSync({
      'poster.jpg': new Uint8Array(40 * 1024 * 1024),
      'Film.srt': new TextEncoder().encode('1\n00:00:01,000 --> 00:00:02,000\nHi\n'),
    });

    expect(zip.length).toBeLessThan(1024 * 1024);
    expect(await fetchSubdlSubtitle('/subtitle/1.zip', null, answeringWith(zip))).toEqual({
      kind: 'downloaded',
      bytes: new TextEncoder().encode('1\n00:00:01,000 --> 00:00:02,000\nHi\n'),
      extension: 'srt',
    });
  });

  it('inflates no subtitle that declares more than a subtitle could be', async () => {
    const zip = zipSync({ 'Film.srt': new Uint8Array(6 * 1024 * 1024) });

    expect(zip.length).toBeLessThan(1024 * 1024);
    expect(await fetchSubdlSubtitle('/subtitle/1.zip', null, answeringWith(zip))).toBeNull();
  });

  it('refuses a download that is bigger than any zip of subtitles would be', async () => {
    const zip = new Uint8Array(6 * 1024 * 1024);

    expect(await fetchSubdlSubtitle('/subtitle/1.zip', null, answeringWith(zip))).toBeNull();
  });
});
