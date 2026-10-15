import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatsHeldIn } from './formatsHeldIn';

describe('formatsHeldIn', () => {
  it('says whether a folder holds a book to read, to listen to, or both', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'held-'));

    expect(await formatsHeldIn(folder)).toEqual({ text: false, audio: false });

    await writeFile(join(folder, 'Book.epub'), '');

    expect(await formatsHeldIn(folder)).toEqual({ text: true, audio: false });

    await writeFile(join(folder, '01 - Book.mp3'), '');

    expect(await formatsHeldIn(folder)).toEqual({ text: true, audio: true });
  });

  it('holds nothing where the folder is not there', async () => {
    expect(await formatsHeldIn(join(tmpdir(), 'not-there-at-all'))).toEqual({
      text: false,
      audio: false,
    });
  });
});
