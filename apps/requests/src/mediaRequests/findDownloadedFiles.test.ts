import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findDownloadedFiles } from './findDownloadedFiles';

describe('findDownloadedFiles', () => {
  it('finds every file in a folder, however deep, with its size', async () => {
    const root = await mkdtemp(join(tmpdir(), 'valence-find-'));

    await mkdir(join(root, 'Subs'));
    await writeFile(join(root, 'Dune.mkv'), 'film');
    await writeFile(join(root, 'Subs', 'English.srt'), 'words');

    expect(
      (await findDownloadedFiles(root)).toSorted((left, right) =>
        left.name.localeCompare(right.name),
      ),
    ).toEqual([
      { path: join(root, 'Dune.mkv'), name: 'Dune.mkv', sizeBytes: 4 },
      { path: join(root, 'Subs', 'English.srt'), name: 'English.srt', sizeBytes: 5 },
    ]);
  });

  it('takes a download that is one file as it is', async () => {
    const root = await mkdtemp(join(tmpdir(), 'valence-find-'));

    await writeFile(join(root, 'Dune.mkv'), 'film');

    expect(await findDownloadedFiles(join(root, 'Dune.mkv'))).toEqual([
      { path: join(root, 'Dune.mkv'), name: 'Dune.mkv', sizeBytes: 4 },
    ]);
  });
});
