import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { CROPS } from '@ValenceServer/pictures/CROPS';
import { handedOutCopyOf } from '@ValenceServer/pictures/handedOutCopyOf';
import { UPLOAD_ADDRESS } from './UPLOAD_ADDRESS';

const DISK = /^valence-disk:([A-Za-z0-9_-]+)$/u;

const PICTURE_EXTENSIONS: ReadonlySet<string> = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/**
 * Reads a picture kept on this server rather than at the catalogue: one beside a title's files on
 * the disk, or one an administrator uploaded, answering as the catalogue's address would, with a
 * cleaned copy rather than the file itself, so nothing the file carried about where it came from is
 * handed out, cut to the part of it chosen where an upload was framed.
 *
 * @param url - The picture's address.
 * @param uploads - Where uploaded pictures are kept.
 * @returns The picture, or nothing where the address is not one kept here, so the caller fetches it.
 */
const readLocalPicture = async (url: string, uploads: string): Promise<Response | null> => {
  const disk = DISK.exec(url);
  const upload = UPLOAD_ADDRESS.exec(url);

  if (disk === null && upload === null) {
    return null;
  }

  const path =
    disk?.[1] === undefined
      ? join(uploads, upload?.[1] ?? '')
      : Buffer.from(disk[1], 'base64url').toString('utf8');

  if (disk !== null && !PICTURE_EXTENSIONS.has(extname(path).toLowerCase())) {
    return new Response(null, { status: 415 });
  }

  try {
    const [, , kind, zoom, x, y] = upload ?? [];
    const cropping =
      kind === 'poster' || kind === 'backdrop'
        ? { crop: CROPS[kind], frame: { zoom: Number(zoom), x: Number(x), y: Number(y) } }
        : null;
    const cleaned = await handedOutCopyOf(new Uint8Array(await readFile(path)), cropping).catch(
      () => null,
    );

    return cleaned === null
      ? new Response(null, { status: 415 })
      : new Response(cleaned, { headers: { 'content-type': 'image/webp' } });
  } catch {
    return new Response(null, { status: 404 });
  }
};

export { readLocalPicture };
