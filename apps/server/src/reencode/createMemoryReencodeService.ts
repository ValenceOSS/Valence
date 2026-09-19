import { randomUUID } from 'node:crypto';
import { estimateReencodeBytes } from '@ValenceCore/functions/estimateReencodeBytes';
import { projectDiskAfter } from '@ValenceCore/functions/projectDiskAfter';
import { refuseReencode } from './refuseReencode';
import type { ReencodeService } from './ReencodeService';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { Reencode, ReencodeSettings } from '@ValenceContracts/schemas/Reencode';
import type { Rendition } from '@ValenceContracts/schemas/Rendition';

const AWAITING_REVIEW_CAP = 5;

type HeldItem = {
  item: MediaItem;
  title: string;
  seriesTitle: string | null;
  libraryId: string;
};

type CreateMemoryReencodeServiceOptions = {
  items?: HeldItem[];
  renditions?: Rendition[];
  freeBytes?: number | null;
  isBeingWatched?: (mediaId: string) => boolean;
  isFolderWritable?: boolean;
};

/**
 * Re-encoding with nothing behind it, for tests that are about the routes rather than about ffmpeg.
 *
 * Every state a request can be in is reachable by asking for it, so a screen showing a queue, an
 * encode awaiting judgement and a rejection can be driven without a single frame being encoded.
 *
 * @param options - What the library holds, what has already been kept, and what is true of the disk.
 * @returns The service.
 */
const createMemoryReencodeService = ({
  items = [],
  renditions = [],
  freeBytes = 900_000_000_000,
  isBeingWatched = () => false,
  isFolderWritable = true,
}: CreateMemoryReencodeServiceOptions = {}): ReencodeService => {
  const held = new Map(items.map((one) => [one.item.id, one]));
  const requests: Reencode[] = [];
  const kept = [...renditions];

  const weigh = (mediaIds: string[], settings: ReencodeSettings) =>
    mediaIds.flatMap((mediaId) => {
      const found = held.get(mediaId);

      if (found === undefined) {
        return [];
      }

      return [
        {
          mediaId,
          title: found.title,
          seriesTitle: found.seriesTitle,
          libraryId: found.libraryId,
          sizeBytes: found.item.sizeBytes ?? 0,
          durationSeconds: found.item.durationSeconds,
          width: found.item.width,
          height: found.item.height,
          videoCodec: found.item.videoCodec,
          videoRange: found.item.videoRange,
          estimatedBytes: estimateReencodeBytes(found.item, settings),
          refusal: refuseReencode({
            item: found.item,
            settings,
            isAlreadyUnderWay: requests.some(
              (one) =>
                one.mediaId === mediaId &&
                ['queued', 'encoding', 'verifying', 'awaitingReview'].includes(one.state),
            ),
            isBeingWatched: isBeingWatched(mediaId),
            isFolderWritable,
          }),
        },
      ];
    });

  const settle = (id: string, state: Reencode['state']): boolean => {
    const at = requests.findIndex((one) => one.id === id);
    const found = requests[at];

    if (found === undefined) {
      return false;
    }

    requests[at] = { ...found, state, reviewedAt: new Date().toISOString() };

    return true;
  };

  return {
    estimate: (mediaIds, settings) => {
      const candidates = weigh(mediaIds, settings);
      const { nowBytes, afterBytes } = projectDiskAfter(candidates, settings.mode);

      return Promise.resolve({
        candidates,
        nowBytes,
        afterBytes,
        freeBytes,
        committedBytes: requests
          .filter((one) => ['queued', 'encoding', 'verifying'].includes(one.state))
          .reduce((total, one) => total + (one.estimatedBytes ?? 0), 0),
        awaitingReview: requests.filter((one) => one.state === 'awaitingReview').length,
        awaitingReviewCap: AWAITING_REVIEW_CAP,
      });
    },

    start: (mediaIds, settings, askedBy) => {
      const candidates = weigh(mediaIds, settings);
      const started: Reencode[] = [];

      for (const candidate of candidates) {
        if (candidate.refusal !== null) {
          continue;
        }

        const made: Reencode = {
          id: randomUUID(),
          mediaId: candidate.mediaId,
          libraryId: candidate.libraryId,
          title: candidate.title,
          seriesTitle: candidate.seriesTitle,
          mode: settings.mode,
          state: 'queued',
          quality: settings.quality,
          videoCodec: settings.videoCodec,
          audio: settings.audio,
          durationSeconds: candidate.durationSeconds,
          originalSizeBytes: candidate.sizeBytes,
          estimatedBytes: candidate.estimatedBytes,
          producedBytes: null,
          progress: 0,
          bytesPerSecond: null,
          failure: null,
          hasSample: false,
          askedAt: new Date().toISOString(),
          startedAt: null,
          encodedAt: null,
          reviewedAt: null,
        };

        requests.push(made);
        started.push(made);
      }

      void askedBy;

      return Promise.resolve({
        started,
        refused: candidates.flatMap((one) =>
          one.refusal === null ? [] : [{ mediaId: one.mediaId, refusal: one.refusal }],
        ),
      });
    },

    list: () => Promise.resolve([...requests]),

    cancel: (id) => Promise.resolve(settle(id, 'cancelled')),

    confirm: (id) => {
      const found = requests.find((one) => one.id === id);

      return Promise.resolve(
        found?.state === 'awaitingReview' ? settle(id, 'finished') : false,
      );
    },

    reject: (id) => {
      const found = requests.find((one) => one.id === id);

      return Promise.resolve(
        found?.state === 'awaitingReview' ? settle(id, 'rejected') : false,
      );
    },

    sample: (id) => {
      const at = requests.findIndex((one) => one.id === id);
      const found = requests[at];

      if (found === undefined) {
        return Promise.resolve(false);
      }

      requests[at] = { ...found, hasSample: true };

      return Promise.resolve(true);
    },

    frame: (id) =>
      Promise.resolve(
        requests.some((one) => one.id === id) ? new ArrayBuffer(8) : null,
      ),

    renditionsFor: (mediaId) =>
      Promise.resolve(kept.filter((one) => one.mediaItemId === mediaId)),

    removeRendition: (id) => {
      const at = kept.findIndex((one) => one.id === id);

      if (at === -1) {
        return Promise.resolve(false);
      }

      kept.splice(at, 1);

      return Promise.resolve(true);
    },

    work: (onProgress) => {
      const queued = requests.filter((one) => one.state === 'queued');

      for (const [at, one] of queued.entries()) {
        onProgress(at, queued.length);

        const position = requests.findIndex((held) => held.id === one.id);
        const found = requests[position];

        if (found !== undefined) {
          requests[position] = {
            ...found,
            state: found.mode === 'keep' ? 'finished' : 'awaitingReview',
            progress: 1,
            producedBytes: found.estimatedBytes,
            encodedAt: new Date().toISOString(),
          };
        }
      }

      return Promise.resolve();
    },
  };
};

export type { CreateMemoryReencodeServiceOptions, HeldItem };

export { AWAITING_REVIEW_CAP, createMemoryReencodeService };
