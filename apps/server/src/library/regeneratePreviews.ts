import { mapWithLimit } from '@ValenceCore/functions/mapWithLimit';
import { askUntilReady } from './askUntilReady';
import { previewRequestFor } from './previewRequestFor';
import type { PreviewMoment } from '@ValenceContracts/schemas/Library';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';
import type { PreviewQuality } from '@ValenceContracts/schemas/PreviewQuality';
import type { Transcoder } from '@ValenceServer/transcoder/TranscoderClient';

type PreviewStore = {
  listOutstanding: (libraryId: string) => Promise<
    {
      id: string;
      path: string;
      audioStreams: AudioStream[];
      previewMoment?: PreviewMoment | null;
    }[]
  >;
  markComplete: (mediaItemId: string) => Promise<void>;
};

type RegeneratePreviewsOptions = {
  libraryId: string;
  generation: number;
  correlationId?: string;
  store: PreviewStore;
  transcoder: Transcoder;
  defaultAudioLanguage: string | null;
  quality: PreviewQuality;
  hardwareAccel?: string;
  atOnce?: number;
  onProblem?: (path: string, reason: string) => void;
  onProgress?: (processed: number, total: number) => void;
  isCancelled?: () => boolean;
};

/**
 * Renders the short clips shown when a pointer rests on a card, for the items of a library that have
 * none. Also what runs after the library's preferred audio language changes, since a preview is cut
 * with sound.
 *
 * @param options - The library to work through, the transcoder that renders, the language to prefer,
 *   the preset to render at, and where to report progress.
 * @returns How many clips were rendered.
 */
const regeneratePreviews = async ({
  libraryId,
  generation,
  correlationId,
  store,
  transcoder,
  defaultAudioLanguage,
  quality,
  hardwareAccel,
  atOnce = 1,
  onProblem,
  onProgress,
  isCancelled,
}: RegeneratePreviewsOptions): Promise<void> => {
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
        ...previewRequestFor(item, generation, defaultAudioLanguage, quality),
        ...(hardwareAccel === undefined || hardwareAccel === '' ? {} : { hardwareAccel }),
        wait: false,
        ...(correlationId === undefined ? {} : { correlationId }),
      };

      const rendered = await askUntilReady({
        ask: () => transcoder.requestPreview(request),
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

export type { PreviewStore };

export { regeneratePreviews };
