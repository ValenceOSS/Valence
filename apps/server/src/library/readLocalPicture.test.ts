import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { diskPictureAddress } from './diskPictureAddress';
import { readLocalPicture } from './readLocalPicture';
import { uploadPictureAddress } from './uploadPictureAddress';

describe('readLocalPicture', () => {
  it('reads a picture beside a title’s files, typed by its name', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-pictures-'));
    const path = join(folder, 'poster.png');

    await writeFile(path, 'png');

    const read = await readLocalPicture(diskPictureAddress(path), folder);

    expect(read?.headers.get('content-type')).toBe('image/png');
    await expect(read?.text()).resolves.toBe('png');
  });

  it('reads an uploaded picture with the type it was uploaded as', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-uploads-'));
    const id = '00000000-0000-4000-8000-000000000001';

    await writeFile(join(folder, id), 'jpg');
    await writeFile(join(folder, `${id}.type`), 'image/jpeg');

    const read = await readLocalPicture(uploadPictureAddress(id), folder);

    expect(read?.headers.get('content-type')).toBe('image/jpeg');
  });

  it('leaves an address kept elsewhere to be fetched, and says a missing one is missing', async () => {
    await expect(readLocalPicture('https://images.example/a.jpg', '/nowhere')).resolves.toBeNull();
    expect(
      (await readLocalPicture(uploadPictureAddress('00000000-0000-4000-8000-000000000009'), '/nowhere'))
        ?.status,
    ).toBe(404);
  });
});
