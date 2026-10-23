import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { moveMediaFile } from './moveMediaFile';

let from = '';

let to = '';

beforeEach(async () => {
  from = await mkdtemp(join(tmpdir(), 'valence-move-from-'));
  to = await mkdtemp(join(tmpdir(), 'valence-move-to-'));
});

afterEach(async () => {
  await rm(from, { recursive: true, force: true });
  await rm(to, { recursive: true, force: true });
});

/**
 * Makes a file, and the folders it sits in.
 *
 * @param path - Where.
 */
const place = async (path: string) => {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, 'x');
};

describe('moveMediaFile', () => {
  it('moves the file with what was kept beside it for it, and leaves another film be', async () => {
    await place(join(from, 'Arrival (2016)/Arrival (2016).mkv'));
    await place(join(from, 'Arrival (2016)/Arrival (2016).en.srt'));
    await place(join(from, 'Arrival (2016)/Arrival (2016).Extended.mkv'));

    await expect(
      moveMediaFile(from, join(from, 'Arrival (2016)/Arrival (2016).mkv'), to),
    ).resolves.toEqual({
      kind: 'moved',
      to: join(to, 'Arrival (2016)/Arrival (2016).mkv'),
      laterTo: [],
    });
    await expect(readdir(join(to, 'Arrival (2016)'))).resolves.toEqual([
      'Arrival (2016).en.srt',
      'Arrival (2016).mkv',
    ]);
    await expect(readdir(join(from, 'Arrival (2016)'))).resolves.toEqual([
      'Arrival (2016).Extended.mkv',
    ]);
  });

  it('moves every part of a film kept as several files, with what was kept for the film', async () => {
    await place(join(from, 'Arrival (2016)/Arrival (2016) - cd1.mkv'));
    await place(join(from, 'Arrival (2016)/Arrival (2016) - cd2.mkv'));
    await place(join(from, 'Arrival (2016)/Arrival (2016) - cd2.en.srt'));
    await place(join(from, 'Arrival (2016)/Arrival (2016).nfo'));

    await expect(
      moveMediaFile(from, join(from, 'Arrival (2016)/Arrival (2016) - cd1.mkv'), to, [
        join(from, 'Arrival (2016)/Arrival (2016) - cd2.mkv'),
      ]),
    ).resolves.toEqual({
      kind: 'moved',
      to: join(to, 'Arrival (2016)/Arrival (2016) - cd1.mkv'),
      laterTo: [join(to, 'Arrival (2016)/Arrival (2016) - cd2.mkv')],
    });
    await expect(readdir(join(to, 'Arrival (2016)'))).resolves.toEqual([
      'Arrival (2016) - cd1.mkv',
      'Arrival (2016) - cd2.en.srt',
      'Arrival (2016) - cd2.mkv',
      'Arrival (2016).nfo',
    ]);
    await expect(readdir(from)).resolves.toEqual([]);
  });

  it('leaves what is kept by a split film’s name while another copy of the film still uses it', async () => {
    await place(join(from, 'Films/Arrival (2016) - cd1.mkv'));
    await place(join(from, 'Films/Arrival (2016) - cd2.mkv'));
    await place(join(from, 'Films/Arrival (2016) - 1080p.mkv'));
    await place(join(from, 'Films/Arrival (2016).nfo'));

    await moveMediaFile(from, join(from, 'Films/Arrival (2016) - cd1.mkv'), to, [
      join(from, 'Films/Arrival (2016) - cd2.mkv'),
    ]);

    await expect(readdir(join(from, 'Films'))).resolves.toEqual([
      'Arrival (2016) - 1080p.mkv',
      'Arrival (2016).nfo',
    ]);
  });

  it('puts back the parts it moved when a later part cannot be moved', async () => {
    await place(join(from, 'Films/Arrival (2016) - cd1.mkv'));

    await expect(
      moveMediaFile(from, join(from, 'Films/Arrival (2016) - cd1.mkv'), to, [
        join(from, 'Films/Arrival (2016) - cd2.mkv'),
      ]),
    ).resolves.not.toMatchObject({ kind: 'moved' });
    await expect(readdir(join(from, 'Films'))).resolves.toEqual(['Arrival (2016) - cd1.mkv']);
  });

  it('moves nothing of a split film when any part’s place is taken', async () => {
    await place(join(from, 'Films/Arrival (2016) - cd1.mkv'));
    await place(join(from, 'Films/Arrival (2016) - cd2.mkv'));
    await place(join(to, 'Films/Arrival (2016) - cd2.mkv'));

    await expect(
      moveMediaFile(from, join(from, 'Films/Arrival (2016) - cd1.mkv'), to, [
        join(from, 'Films/Arrival (2016) - cd2.mkv'),
      ]),
    ).resolves.toEqual({ kind: 'taken' });
    await expect(readdir(join(from, 'Films'))).resolves.toEqual([
      'Arrival (2016) - cd1.mkv',
      'Arrival (2016) - cd2.mkv',
    ]);
  });

  it('refuses a path outside the library before touching anything', async () => {
    await expect(moveMediaFile(from, join(tmpdir(), 'Arrival.mkv'), to)).resolves.toEqual({
      kind: 'outside',
    });
    await expect(moveMediaFile(from, from, to)).resolves.toEqual({ kind: 'outside' });
  });
});
