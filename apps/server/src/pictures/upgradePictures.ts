import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PICTURE_FOLDERS } from './PICTURE_FOLDERS';
import { handedOutCopyOf } from './handedOutCopyOf';
import { isThere } from './isThere';
import { moveFile } from './moveFile';
import { processedNameOf } from './processedNameOf';
import type { PictureCrop } from './PictureCrop';

/**
 * Brings pictures kept before they were cleaned up to date: each upload still loose in the folder is
 * moved among the originals, and any original without its cleaned copy is given one. A picture
 * already brought up to date is left as it is, so this can run at every start.
 *
 * @param directory - The folder the pictures are kept in.
 * @param pictures - The originals to look for, by name, each with the shape it is cut to where it
 *   is shown in one.
 * @param onProblem - Told of a picture that could not be moved or cleaned, which is left for next time.
 * @returns How many were moved and how many cleaned.
 */
const upgradePictures = async (
  directory: string,
  pictures: readonly { name: string; cropping: PictureCrop | null }[],
  onProblem: (name: string, reason: Error) => void,
): Promise<{ moved: number; processed: number }> => {
  const originals = join(directory, PICTURE_FOLDERS.originals);
  const processedFolder = join(directory, PICTURE_FOLDERS.processed);
  let moved = 0;
  let processed = 0;

  const seen = new Set<string>();

  for (const { name, cropping } of pictures) {
    if (seen.has(name)) {
      continue;
    }

    seen.add(name);

    const loose = join(directory, name);
    const original = join(originals, name);
    const cleaned = join(processedFolder, processedNameOf(name));

    try {
      if ((await isThere(loose)) && !(await isThere(original))) {
        await mkdir(originals, { recursive: true });
        await moveFile(loose, original);
        moved += 1;
      }

      if (!(await isThere(original)) || (await isThere(cleaned))) {
        continue;
      }

      const made = await handedOutCopyOf(new Uint8Array(await readFile(original)), cropping);

      await mkdir(processedFolder, { recursive: true });
      await writeFile(cleaned, made);
      processed += 1;
    } catch (error) {
      onProblem(name, error instanceof Error ? error : new Error(String(error)));
    }
  }

  return { moved, processed };
};

export { upgradePictures };
