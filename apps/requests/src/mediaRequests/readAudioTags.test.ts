import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readAudioTags } from './readAudioTags';

let folder = '';

beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), 'valence-tags-'));
});

afterEach(async () => {
  await rm(folder, { recursive: true, force: true });
});

/**
 * An ID3v2.3 text frame.
 */
const frameOf = (id: string, text: string): Buffer => {
  const body = Buffer.concat([Buffer.from([0]), Buffer.from(text, 'latin1')]);
  const size = Buffer.alloc(4);

  size.writeUInt32BE(body.length);

  return Buffer.concat([Buffer.from(id, 'latin1'), size, Buffer.from([0, 0]), body]);
};

/**
 * An MP3 file holding nothing but an ID3v2.3 tag with the frames given.
 */
const anMp3 = (frames: readonly Buffer[]): Buffer => {
  const tag = Buffer.concat(frames);
  const size = tag.length;
  const syncsafe = Buffer.from([
    (size >> 21) & 0x7f,
    (size >> 14) & 0x7f,
    (size >> 7) & 0x7f,
    size & 0x7f,
  ]);

  return Buffer.concat([Buffer.from('ID3', 'latin1'), Buffer.from([3, 0, 0]), syncsafe, tag]);
};

describe('readAudioTags', () => {
  it('reads the album’s artist, the album, the year, and the track’s place and title', async () => {
    const path = join(folder, 'track.mp3');

    await writeFile(
      path,
      anMp3([
        frameOf('TPE1', 'Pink Floyd'),
        frameOf('TPE2', 'Pink Floyd'),
        frameOf('TALB', 'The Wall'),
        frameOf('TYER', '1979'),
        frameOf('TPOS', '2/2'),
        frameOf('TRCK', '3/13'),
        frameOf('TIT2', 'Comfortably Numb'),
      ]),
    );

    expect(await readAudioTags(path)).toEqual({
      artist: 'Pink Floyd',
      album: 'The Wall',
      year: 1979,
      disc: 2,
      track: 3,
      title: 'Comfortably Numb',
    });
  });

  it('says nothing of a file it cannot read', async () => {
    expect(await readAudioTags(join(folder, 'missing.flac'))).toEqual({
      artist: null,
      album: null,
      year: null,
      disc: null,
      track: null,
      title: null,
    });
  });
});
