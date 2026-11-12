import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { diskPictureAddress } from './diskPictureAddress';
import { readLocalPicture } from './readLocalPicture';
import { uploadPictureAddress } from './uploadPictureAddress';

const aPhoto = () =>
  sharp({ create: { width: 8, height: 12, channels: 3, background: '#3a8ee8' } })
    .withExif({ IFD0: { Make: 'A camera', Copyright: 'Somebody' } })
    .png()
    .toBuffer();

const readBack = async (answer: Response | null) =>
  sharp(new Uint8Array(await (answer ?? new Response()).arrayBuffer())).metadata();

describe('readLocalPicture', () => {
  it('reads a picture beside a title’s files as a cleaned copy, leaving the file alone', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-pictures-'));
    const path = join(folder, 'poster.png');
    const photo = await aPhoto();

    await writeFile(path, photo);

    const read = await readLocalPicture(diskPictureAddress(path), folder);
    const measured = await readBack(read);

    expect(read?.headers.get('content-type')).toBe('image/webp');
    expect(measured).toMatchObject({ format: 'webp', width: 8, height: 12 });
    expect(measured.exif).toBeUndefined();
    expect((await sharp(path).metadata()).exif).toBeDefined();
  });

  it('reads an uploaded picture as a cleaned copy', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-uploads-'));
    const id = '00000000-0000-4000-8000-000000000001';

    await writeFile(join(folder, id), await aPhoto());

    const read = await readLocalPicture(uploadPictureAddress(id), folder);

    expect(read?.headers.get('content-type')).toBe('image/webp');
    expect((await readBack(read)).exif).toBeUndefined();
  });

  it('turns away a file beside a title’s files that is not a picture, or will not read as one', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-pictures-'));

    await writeFile(join(folder, 'notes.txt'), 'text');
    await writeFile(join(folder, 'poster.jpg'), 'not a picture');

    expect(
      (await readLocalPicture(diskPictureAddress(join(folder, 'notes.txt')), folder))?.status,
    ).toBe(415);
    expect(
      (await readLocalPicture(diskPictureAddress(join(folder, 'poster.jpg')), folder))?.status,
    ).toBe(415);
  });

  it('leaves an address kept elsewhere to be fetched, and says a missing one is missing', async () => {
    await expect(readLocalPicture('https://images.example/a.jpg', '/nowhere')).resolves.toBeNull();
    expect(
      (
        await readLocalPicture(
          uploadPictureAddress('00000000-0000-4000-8000-000000000009'),
          '/nowhere',
        )
      )?.status,
    ).toBe(404);
  });
});
