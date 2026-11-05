import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const DISK = /^valence-disk:([A-Za-z0-9_-]+)$/u;

const UPLOAD = /^valence-upload:([0-9a-f-]{36})$/u;

const TYPES: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/**
 * Reads a picture kept on this server rather than at the catalogue: one beside a title's files on
 * the disk, or one an administrator uploaded, answering as the catalogue's address would.
 *
 * @param url - The picture's address.
 * @param uploads - Where uploaded pictures are kept.
 * @returns The picture, or nothing where the address is not one kept here, so the caller fetches it.
 */
const readLocalPicture = async (url: string, uploads: string): Promise<Response | null> => {
  const disk = DISK.exec(url);
  const upload = UPLOAD.exec(url);

  if (disk === null && upload === null) {
    return null;
  }

  try {
    if (disk?.[1] !== undefined) {
      const path = Buffer.from(disk[1], 'base64url').toString('utf8');
      const type = TYPES[extname(path).toLowerCase()];

      return type === undefined
        ? new Response(null, { status: 415 })
        : new Response(await readFile(path), { headers: { 'content-type': type } });
    }

    const id = upload?.[1] ?? '';
    const type = await readFile(join(uploads, `${id}.type`), 'utf8');

    return new Response(await readFile(join(uploads, id)), { headers: { 'content-type': type } });
  } catch {
    return new Response(null, { status: 404 });
  }
};

export { readLocalPicture };
