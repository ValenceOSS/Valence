import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readTrackTags } from './readTrackTags';

/**
 * Writes a second of silence as a WAV, which is the one audio file simple enough to build by hand.
 *
 * @param path - Where to put it.
 */
const writeSilence = async (path: string): Promise<void> => {
  const rate = 8000;
  const data = Buffer.alloc(rate * 2);
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  await writeFile(path, Buffer.concat([header, data]));
};

const MPEG_FRAME_BYTES = 417;

const ABOUT_A_SECOND_OF_FRAMES = 40;

/**
 * Writes about a second of MP3 whose ID3 tag carries unsynchronised lyrics, as files ripped from
 * the internet often do: a frame of words with no timed lines beside it.
 *
 * @param path - Where to put it.
 * @param words - What the lyrics frame says.
 */
const writeMp3WithLyrics = async (path: string, words: string): Promise<void> => {
  const lyrics = Buffer.concat([
    Buffer.from([0]),
    Buffer.from('eng', 'latin1'),
    Buffer.from([0]),
    Buffer.from(words, 'latin1'),
  ]);
  const frameHeader = Buffer.alloc(10);

  frameHeader.write('USLT', 0, 'latin1');
  frameHeader.writeUInt32BE(lyrics.length, 4);

  const frames = Buffer.concat([frameHeader, lyrics]);
  const tagHeader = Buffer.from([0x49, 0x44, 0x33, 3, 0, 0, 0, 0, 0, 0]);
  const size = frames.length;

  tagHeader[6] = (size >> 21) & 0x7f;
  tagHeader[7] = (size >> 14) & 0x7f;
  tagHeader[8] = (size >> 7) & 0x7f;
  tagHeader[9] = size & 0x7f;

  const audioFrame = Buffer.alloc(MPEG_FRAME_BYTES);

  audioFrame.set([0xff, 0xfb, 0x90, 0xc4], 0);

  await writeFile(
    path,
    Buffer.concat([
      tagHeader,
      frames,
      ...Array.from({ length: ABOUT_A_SECOND_OF_FRAMES }, () => audioFrame),
    ]),
  );
};

describe('readTrackTags', () => {
  it('reads a track whose tag carries lyrics with no timed lines', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'valence-music-'));
    const path = join(directory, '02 - 02. Return To Paradise.mp3');

    await writeMp3WithLyrics(path, 'Words to sing along to');

    const tags = await readTrackTags(path);

    expect(tags?.codec).toBe('mpeg 1 layer 3');
    expect(tags?.lyrics).toBe('Words to sing along to');
  });

  it('reads a track out of its file, named from the file where it has no tags', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'valence-music-'));
    const path = join(directory, '04. Dangerous.wav');

    await writeSilence(path);

    const tags = await readTrackTags(path);

    expect(tags?.title).toBe('Dangerous');
    expect(tags?.durationSeconds).toBeCloseTo(1);
    expect(tags?.sampleRate).toBe(8000);
  });

  it('reads nothing out of a file that is not audio', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'valence-music-'));
    const path = join(directory, 'notes.mp3');

    await writeFile(path, 'not a track');

    await expect(readTrackTags(path)).resolves.toBeNull();
  });

  it('reads nothing out of a file that is not there', async () => {
    await expect(readTrackTags('/nowhere/at/all.flac')).resolves.toBeNull();
  });
});
