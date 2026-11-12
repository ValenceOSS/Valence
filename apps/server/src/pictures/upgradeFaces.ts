import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { PICTURE_FOLDERS } from './PICTURE_FOLDERS';
import { processFace } from './processFace';
import { MOVING_FACE_TYPES } from './MOVING_FACE_TYPES';
import { cropFace } from './cropFace';
import { framedNameOf } from './framedNameOf';
import { processedNameOf } from './processedNameOf';
import { isThere } from './isThere';
import { moveFile } from './moveFile';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * Brings faces kept before they were processed up to date: each upload still loose in the folder is
 * moved among the originals, and any original missing either picture made from it — the whole one,
 * or the square its frame chose — is given it. A face already brought up to date is left as it is,
 * so this can run at every start.
 *
 * @param directory - The folder faces are kept in.
 * @param faces - The originals to look for, by name, each with where it sits in its circle.
 * @param onProblem - Told of a face that could not be moved or processed, which is left for next time.
 * @returns How many were moved and how many processed.
 */
const upgradeFaces = async (
  directory: string,
  faces: readonly { name: string; frame: PhotoFrame | null }[],
  onProblem: (name: string, reason: Error) => void,
): Promise<{ moved: number; processed: number }> => {
  const originals = join(directory, PICTURE_FOLDERS.originals);
  const processedFolder = join(directory, PICTURE_FOLDERS.processed);
  const seen = new Set<string>();
  let moved = 0;
  let processed = 0;

  for (const { name, frame } of faces) {
    if (seen.has(name)) {
      continue;
    }

    seen.add(name);

    const loose = join(directory, name);
    const original = join(originals, name);
    const whole = join(processedFolder, processedNameOf(name));
    const framed = join(processedFolder, framedNameOf(name));

    try {
      if ((await isThere(loose)) && !(await isThere(original))) {
        await mkdir(originals, { recursive: true });
        await moveFile(loose, original);
        moved += 1;
      }

      const isMissing = !(await isThere(whole)) || !(await isThere(framed));

      if (
        MOVING_FACE_TYPES[extname(name)] !== undefined ||
        !(await isThere(original)) ||
        !isMissing
      ) {
        continue;
      }

      const body = new Uint8Array(await readFile(original));
      const [madeWhole, madeFramed] = await Promise.all([processFace(body), cropFace(body, frame)]);

      await mkdir(processedFolder, { recursive: true });
      await writeFile(whole, madeWhole);
      await writeFile(framed, madeFramed);
      processed += 1;
    } catch (error) {
      onProblem(name, error instanceof Error ? error : new Error(String(error)));
    }
  }

  return { moved, processed };
};

export { upgradeFaces };
