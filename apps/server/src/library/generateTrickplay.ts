import { mapWithLimit } from '@ValenceCore/functions/mapWithLimit';
import { askUntilReady } from './askUntilReady';
import type { Transcoder } from '@ValenceServer/transcoder/TranscoderClient';

type TrickplayStore = {
  listOutstanding: (libraryId: string) => Promise<{ id: string; path: string }[]>;
  markComplete: (mediaItemId: string) => Promise<void>;
};

type TrickplayParams = {
  intervalSeconds: number;
  tileWidth: number;
  columns: number;
  rows: number;
};

type GenerateTrickplayOptions = {
  libraryId: string;
  generation: number;
  correlationId?: string;
  store: TrickplayStore;
  transcoder: Transcoder;
  trickplay: TrickplayParams;
  hardwareAccel?: string;
  atOnce?: number;
  onProblem?: (path: string, reason: string) => void;
  onProgress?: (processed: number, total: number) => void;
  isCancelled?: () => boolean;
};

/**
 * Renders the sheets of thumbnails shown while scrubbing, for the items of a library that have none.
 * Records each item as done as it goes, so a restart resumes rather than beginning again.
 *
 * @param options - The library to work through, the transcoder that renders, which job asked for
 *   it, and where to report progress.
 * @returns How many items were rendered.
 */
const generateTrickplay = async ({
  libraryId,
  generation,
  correlationId,
  store,
  transcoder,
  trickplay,
  hardwareAccel,
  atOnce = 1,
  onProblem,
  onProgress,
  isCancelled,
}: GenerateTrickplayOptions): Promise<void> => {
  const attempted = new Set<string>();
  let processed = 0;
  let total = 0;

  for (;;) {
    if (isCancelled?.() === true) {
      return;
    }

    const outstanding = await store.listOutstanding(libraryId);
    const items = outstanding.filter((item) => !attempted.has(item.id));

    if (items.length === 0) {
      return;
    }

    for (const item of items) {
      attempted.add(item.id);
    }

    total += items.length;
    onProgress?.(processed, total);

    await mapWithLimit(items, atOnce, async (item) => {
      if (isCancelled?.() === true) {
        return;
      }

      const request = {
        inputPath: item.path,
        generation,
        ...trickplay,
        ...(hardwareAccel === undefined || hardwareAccel === '' ? {} : { hardwareAccel }),
        wait: false,
        ...(correlationId === undefined ? {} : { correlationId }),
      };

      const rendered = await askUntilReady({
        ask: () => transcoder.requestTrickplay(request),
        isCancelled,
      }).catch((error: Error) => {
        if (isCancelled?.() !== true) {
          onProblem?.(item.path, error.message);
        }

        return false;
      });

      if (rendered) {
        await store.markComplete(item.id);
      }

      if (isCancelled?.() !== true) {
        processed += 1;
        onProgress?.(processed, total);
      }
    });
  }
};

export type { TrickplayParams, TrickplayStore };

export { generateTrickplay };
