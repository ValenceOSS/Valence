import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readSoundTags } from './readSoundTags';

/**
 * An ID3 text frame holding a value.
 *
 * @param id - The frame's id.
 * @param value - What it says.
 * @returns The frame.
 */
const frameOf = (id: string, value: string): Buffer => {
  const text = Buffer.concat([Buffer.from([0]), Buffer.from(value, 'latin1')]);
  const size = Buffer.alloc(4);

  size.writeUInt32BE(text.length);

  return Buffer.concat([Buffer.from(id, 'latin1'), size, Buffer.from([0, 0]), text]);
};

/**
 * A track holding only an ID3 tag with the album, title and artist given.
 *
 * @returns The track's bytes.
 */
const aTaggedTrack = (): Buffer => {
  const frames = Buffer.concat([
    frameOf('TALB', 'The First Book'),
    frameOf('TIT2', 'Chapter One'),
    frameOf('TPE1', 'An Author'),
    frameOf('TYER', '2011'),
  ]);
  const size = frames.length;
  const header = Buffer.from([
    0x49,
    0x44,
    0x33,
    3,
    0,
    0,
    (size >> 21) & 0x7f,
    (size >> 14) & 0x7f,
    (size >> 7) & 0x7f,
    size & 0x7f,
  ]);

  return Buffer.concat([header, frames]);
};

describe('readSoundTags', () => {
  it('reads the album, title, author and year a track is tagged with', async () => {
    const path = join(await mkdtemp(join(tmpdir(), 'tags-')), 'track.mp3');

    await writeFile(path, aTaggedTrack());

    expect(await readSoundTags(path)).toEqual({
      album: 'The First Book',
      title: 'Chapter One',
      author: 'An Author',
      year: 2011,
    });
  });

  it('says nothing of a file it cannot read', async () => {
    expect(await readSoundTags(join(tmpdir(), 'no-such-track.mp3'))).toBeNull();
  });
});
