import { previewRequestFor } from './previewRequestFor';
import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';
import type { PreviewQuality } from '@ValenceContracts/schemas/PreviewQuality';
import type { RebuildSubject } from './rebuildItemArtefacts';
import type {
  PreviewSweepSubject,
  TrickplayRequest,
} from '@ValenceServer/transcoder/TranscoderClient';

type MadePart = Extract<LibraryPart, 'previews' | 'scrubPreviews'>;

type HeldPart = Exclude<LibraryPart, MadePart>;

type ClearableLibrary = {
  empty: (libraryId: string, part: HeldPart) => Promise<string[]>;
  listMade: (libraryId: string) => Promise<RebuildSubject[]>;
  forgetMade: (libraryId: string, part: MadePart) => Promise<void>;
};

type ClearLibraryPartsOptions = {
  libraryId: string;
  parts: readonly LibraryPart[];
  store: ClearableLibrary;
  images: { forget: (url: string) => Promise<void> };
  files: { remove: (path: string) => Promise<void> };
  transcoder: {
    forgetPreview: (request: PreviewSweepSubject) => Promise<boolean>;
    forgetTrickplay: (request: TrickplayRequest) => Promise<boolean>;
  };
  quality: PreviewQuality;
  trickplay: { intervalSeconds: number; tileWidth: number; columns: number; rows: number };
  onProblem?: (what: string, reason: string) => void;
  onProgress?: (done: number, total: number) => Promise<void> | void;
  isCancelled?: () => Promise<boolean> | boolean;
};

/**
 * Whether a part is drawn by the transcoder rather than held in the database.
 *
 * @param part - The part.
 * @returns Whether it is a preview clip or a scrub preview.
 */
const isMade = (part: LibraryPart): part is MadePart =>
  part === 'previews' || part === 'scrubPreviews';

/**
 * Erases the chosen parts of one library, and nothing else about it.
 *
 * What the database holds is emptied a part at a time; where a part pointed at pictures, the copies
 * this server kept of them go too, so what comes back is fetched afresh rather than read off the
 * disk. Preview clips and scrub previews live with the transcoder, keyed by what they were made
 * from, so each item's are forgotten one by one — the only way to reach them. The record that they
 * were made goes first, so work stopped part-way leaves the rest to be asked for again, and the
 * transcoder answers that whatever it still holds is already drawn.
 *
 * Progress counts a part held in the database as one step and a part the transcoder drew as one
 * step per item, since that is where the time goes. It stops between steps when asked to.
 *
 * @param options - The library and the parts to clear, where each part is kept, and how to report.
 * @returns Whether every part was cleared, rather than the work being stopped part-way.
 */
const clearLibraryParts = async ({
  libraryId,
  parts,
  store,
  images,
  files,
  transcoder,
  quality,
  trickplay,
  onProblem,
  onProgress,
  isCancelled,
}: ClearLibraryPartsOptions): Promise<boolean> => {
  const made = parts.some(isMade) ? await store.listMade(libraryId) : [];
  const total = parts.reduce((sum, part) => sum + (isMade(part) ? made.length : 1), 0);
  let done = 0;

  /**
   * Counts one step as done, and says whether to carry on.
   *
   * @returns Whether the work has been asked to stop.
   */
  const step = async (): Promise<boolean> => {
    done += 1;
    await onProgress?.(done, total);

    return (await isCancelled?.()) ?? false;
  };

  for (const part of parts) {
    if (isMade(part)) {
      await store.forgetMade(libraryId, part);

      for (const item of made) {
        const forgotten =
          part === 'previews'
            ? transcoder.forgetPreview(
                previewRequestFor(item, item.generation, item.defaultAudioLanguage, quality),
              )
            : transcoder.forgetTrickplay({
                inputPath: item.path,
                generation: item.generation,
                ...trickplay,
              });

        await forgotten.catch((error: Error) => {
          onProblem?.(item.path, error.message);

          return false;
        });

        if (await step()) {
          return false;
        }
      }

      continue;
    }

    const held = await store.empty(libraryId, part);

    for (const where of held) {
      const forgotten =
        part === 'albumCovers' || part === 'artistPictures'
          ? files.remove(where)
          : images.forget(where);

      await forgotten.catch((error: Error) => {
        onProblem?.(where, error.message);
      });
    }

    if (await step()) {
      return false;
    }
  }

  return true;
};

export type { ClearableLibrary };

export { clearLibraryParts };
