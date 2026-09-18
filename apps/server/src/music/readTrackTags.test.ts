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

describe('readTrackTags', () => {
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
