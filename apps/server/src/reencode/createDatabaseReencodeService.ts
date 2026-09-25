import { say } from '@ValenceI18n/say';
import { randomUUID } from 'node:crypto';
import { rm, stat } from 'node:fs/promises';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { estimateReencodeBytes } from '@ValenceCore/functions/estimateReencodeBytes';
import { planReencodeSpec } from '@ValenceCore/functions/planReencodeSpec';
import { renditionLabel } from '@ValenceCore/functions/renditionLabel';
import { MonitorDisksSchema } from '@ValenceServer/maintenance/DiskUse';
import { mediaItem, mediaRendition, reencodeRequest } from '@ValenceServer/db/Schema';
import { RenditionSchema } from '@ValenceContracts/schemas/Rendition';
import {
  REENCODES_STILL_TO_BE_WRITTEN,
  REENCODES_UNDER_WAY,
  ReencodeSchema,
  ReencodeSettingsSchema,
} from '@ValenceContracts/schemas/Reencode';
import { MediaFactsSchema } from './MediaFacts';
import { canWriteInto } from './canWriteInto';
import { factsFromProbe } from './factsFromProbe';
import { freeBytesOn } from './freeBytesOn';
import { reencodePathsFor } from './reencodePathsFor';
import { refuseReencode } from './refuseReencode';
import { restoreOriginal } from './restoreOriginal';
import { swapIntoPlace } from './swapIntoPlace';
import type { MediaFacts } from './MediaFacts';
import type { ReencodeService } from './ReencodeService';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type {
  Reencode,
  ReencodeCandidate,
  ReencodeSettings,
} from '@ValenceContracts/schemas/Reencode';
import type { Rendition } from '@ValenceContracts/schemas/Rendition';
import type {
  Transcoder,
  TranscoderCapabilities,
} from '@ValenceServer/transcoder/TranscoderClient';

const SAMPLE_SECONDS = 60;

const A_SCENE_WITH_MOTION = 0.4;

const ASK_AGAIN_MS = 4000;

type ReencodeSubject = {
  item: MediaItem;
  title: string;
  seriesTitle: string | null;
  path: string;
  libraryId: string;
  libraryPath: string;
};

type ReencodeMedia = {
  findForReencode: (mediaId: string) => Promise<ReencodeSubject | null>;
};

type CreateDatabaseReencodeServiceOptions = {
  db: ValenceDatabase;
  media: ReencodeMedia;
  transcoder: Transcoder;
  capabilities: () => Promise<TranscoderCapabilities>;
  forcedAccel: () => Promise<string>;
  isBeingWatched: (mediaId: string) => boolean;
  awaitingReviewCap: () => Promise<number>;
  afterChange: (mediaItemId: string) => Promise<void>;
  onProblem?: (what: string, reason: string) => void;
  wait?: (milliseconds: number) => Promise<void>;
};

type RequestRow = typeof reencodeRequest.$inferSelect;

/**
 * Waits, so a poll of the media service is a poll rather than a spin.
 *
 * @param milliseconds - How long to wait.
 * @returns Nothing, once that long has passed.
 */
const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

/**
 * What a stored request was asked for, read back out of its row.
 *
 * Through the schema rather than by trusting the columns. The check constraints make the values
 * legal, not typed, and everything downstream reasons about a mode and a rung rather than about
 * two strings.
 *
 * @param row - The stored request.
 * @returns What was chosen.
 */
const settingsOf = (row: RequestRow): ReencodeSettings =>
  ReencodeSettingsSchema.parse({
    mode: row.mode,
    quality: row.quality,
    videoCodec: row.videoCodec,
    audio: row.audio,
  });

/**
 * A stored request as the administrator's screen reads it.
 *
 * @param row - The row.
 * @param title - What the item is called, and what programme it belongs to.
 * @returns The request.
 */
const asReencode = (
  row: RequestRow,
  title: { title: string; seriesTitle: string | null; durationSeconds: number },
): Reencode =>
  ReencodeSchema.parse({
    id: row.id,
    mediaId: row.mediaItemId,
    libraryId: row.libraryId,
    title: title.title,
    seriesTitle: title.seriesTitle,
    mode: row.mode,
    state: row.state,
    quality: row.quality,
    videoCodec: row.videoCodec,
    audio: row.audio,
    durationSeconds: title.durationSeconds,
    originalSizeBytes: row.originalSizeBytes,
    estimatedBytes: row.estimatedBytes,
    producedBytes: row.producedBytes,
    progress: row.progress / 100,
    bytesPerSecond: row.bytesPerSecond,
    failure: row.failure,
    hasSample: row.samplePath !== null,
    askedAt: row.askedAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    encodedAt: row.encodedAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  });

/**
 * Re-encoding as it actually runs: weighing what a batch would cost, queueing it, producing each
 * file one at a time, and holding every replacement until a person has judged it.
 *
 * Sequential on purpose. At its peak a replacement holds the original, the new file and whatever
 * ffmpeg is still writing, so processing a batch in parallel multiplies the worst case by the size
 * of the batch — and a feature for reclaiming storage must not be the thing that exhausts it.
 *
 * @param options - The database, the library to read files from, the media service to run encodes
 *   on, and the facts only the rest of the server knows: what is being watched, how many encodes may
 *   wait for judgement at once, and what to do once an item's bytes have changed underneath it.
 * @returns The service.
 */
const createDatabaseReencodeService = ({
  db,
  media,
  transcoder,
  capabilities,
  forcedAccel,
  isBeingWatched,
  awaitingReviewCap,
  afterChange,
  onProblem,
  wait = sleep,
}: CreateDatabaseReencodeServiceOptions): ReencodeService => {
  const freeBytesFor = async (path: string): Promise<number | null> => {
    const report = MonitorDisksSchema.safeParse(await transcoder.readMonitor());

    return report.success ? freeBytesOn(report.data.resources.disks, path) : null;
  };

  const committedBytes = async (): Promise<number> => {
    const rows = await db
      .select({ estimatedBytes: reencodeRequest.estimatedBytes })
      .from(reencodeRequest)
      .where(inArray(reencodeRequest.state, [...REENCODES_STILL_TO_BE_WRITTEN]));

    return rows.reduce((total, row) => total + (row.estimatedBytes ?? 0), 0);
  };

  const awaitingReviewCount = async (): Promise<number> => {
    const rows = await db
      .select({ counted: sql<number>`count(*)::int` })
      .from(reencodeRequest)
      .where(eq(reencodeRequest.state, 'awaitingReview'));

    return rows[0]?.counted ?? 0;
  };

  const underWayFor = async (mediaIds: string[]): Promise<Set<string>> => {
    if (mediaIds.length === 0) {
      return new Set();
    }

    const rows = await db
      .select({ mediaItemId: reencodeRequest.mediaItemId })
      .from(reencodeRequest)
      .where(
        and(
          inArray(reencodeRequest.mediaItemId, mediaIds),
          inArray(reencodeRequest.state, [...REENCODES_UNDER_WAY]),
        ),
      );

    return new Set(rows.map((row) => row.mediaItemId));
  };

  const weigh = async (
    mediaIds: string[],
    settings: ReencodeSettings,
  ): Promise<{ candidates: ReencodeCandidate[]; subjects: Map<string, ReencodeSubject> }> => {
    const underWay = await underWayFor(mediaIds);
    const subjects = new Map<string, ReencodeSubject>();
    const candidates: ReencodeCandidate[] = [];
    const writable = new Map<string, boolean>();

    for (const mediaId of mediaIds) {
      const found = await media.findForReencode(mediaId);

      if (found === null) {
        continue;
      }

      subjects.set(mediaId, found);

      const { directory } = reencodePathsFor(found.libraryPath, found.path, 'probe');
      const known = writable.get(directory) ?? (await canWriteInto(directory));

      writable.set(directory, known);

      candidates.push({
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
          isAlreadyUnderWay: underWay.has(mediaId),
          isBeingWatched: isBeingWatched(mediaId),
          isFolderWritable: known,
        }),
      });
    }

    return { candidates, subjects };
  };

  const titleFor = async (
    row: RequestRow,
  ): Promise<{ title: string; seriesTitle: string | null; durationSeconds: number }> => {
    const found = await media.findForReencode(row.mediaItemId);

    return {
      title: found?.title ?? say('server.reencode.gone'),
      seriesTitle: found?.seriesTitle ?? null,
      durationSeconds: found?.item.durationSeconds ?? 1,
    };
  };

  const writeFacts = async (mediaItemId: string, facts: MediaFacts): Promise<void> => {
    await db
      .update(mediaItem)
      .set({
        sizeBytes: facts.sizeBytes,
        modifiedAtMs: facts.modifiedAtMs,
        container: facts.container,
        durationSeconds: facts.durationSeconds,
        bitrateKbps: facts.bitrateKbps,
        videoCodec: facts.videoCodec,
        videoRange: facts.videoRange,
        videoRangeBase: facts.videoRangeBase,
        videoBitDepth: facts.videoBitDepth,
        canCopySegments: facts.canCopySegments,
        videoLevel: facts.videoLevel,
        videoFrameRate: facts.videoFrameRate,
        videoIsInterlaced: facts.videoIsInterlaced,
        videoRefFrames: facts.videoRefFrames,
        videoCodecTag: facts.videoCodecTag,
        videoPixelAspect: facts.videoPixelAspect,
        videoRotationDegrees: facts.videoRotationDegrees,
        width: facts.width,
        height: facts.height,
        audioStreams: facts.audioStreams,
        subtitleStreams: facts.subtitleStreams,
        chapters: facts.chapters,
        updatedAt: new Date(),
      })
      .where(eq(mediaItem.id, mediaItemId));
  };

  const readFacts = async (path: string): Promise<MediaFacts> => {
    const [probe, found] = await Promise.all([transcoder.probe(path), stat(path)]);

    return factsFromProbe({
      probe,
      sizeBytes: found.size,
      modifiedAtMs: Math.floor(found.mtimeMs),
    });
  };

  const failWith = async (id: string, reason: string): Promise<void> => {
    onProblem?.('reencode', reason);

    await db
      .update(reencodeRequest)
      .set({ state: 'failed', failure: reason, progress: 0, bytesPerSecond: null })
      .where(eq(reencodeRequest.id, id));
  };

  /**
   * Takes the oldest thing waiting, in a way nothing else can take at the same time.
   *
   * Reading a row and then marking it is two steps, and two workers reading between each other's
   * steps both believe they have it — so one film is encoded twice, onto one path, by two processes
   * writing over each other. `for update skip locked` makes the taking the same statement as the
   * finding: whoever gets there second finds nothing rather than finding the same thing.
   *
   * One at a time and oldest first, deliberately. At its peak a replacement holds the original, the
   * new file and whatever ffmpeg is still writing, so running a batch in parallel multiplies the
   * worst case by the size of the batch — and a feature for reclaiming storage must not be the
   * thing that exhausts it.
   *
   * @returns The request now being worked on, or nothing where none was waiting.
   */
  const claimTheNextOne = async (): Promise<RequestRow | undefined> => {
    const taken = await db
      .update(reencodeRequest)
      .set({ state: 'encoding', startedAt: new Date(), failure: null })
      .where(
         
        sql`${reencodeRequest.id} = (
          select ${reencodeRequest.id} from ${reencodeRequest}
          where ${reencodeRequest.state} = 'queued'
          order by ${reencodeRequest.askedAt} asc
          limit 1
          for update skip locked
        )`,
      )
      .returning();

    return taken[0];
  };

  /**
   * Takes back up anything that was being worked on when this server last stopped.
   *
   * A server restarts for ordinary reasons — an update, a crash, somebody pulling a plug — and an
   * encode outlives it: the media service is a separate process and carries on writing. What does
   * not outlive it is the loop that was watching, so without this a row sits at `encoding` for ever
   * while a finished file sits unused beside the film, and that file can never be asked for again
   * because something is already under way on it.
   *
   * Simply queued again, because asking for a rendition that already exists answers that it is
   * ready rather than encoding it a second time. So work that finished is picked straight back up
   * at the swap, and work that did not starts over — without either case being written out here as
   * a special one.
   */
  const pickUpWhereItWasLeft = async (): Promise<void> => {
    const stranded = await db
      .update(reencodeRequest)
      .set({ state: 'queued', progress: 0, bytesPerSecond: null })
      .where(inArray(reencodeRequest.state, ['encoding', 'verifying']))
      .returning({ originalPath: reencodeRequest.originalPath });

    for (const row of stranded) {
      onProblem?.(
        'reencode',
        // eslint-disable-next-line valence/no-hard-coded-strings -- a log line
        `took ${row.originalPath} back up, since this server stopped while it was being worked on`,
      );
    }
  };

  const encode = async (row: RequestRow, isCancelled: () => boolean): Promise<void> => {
    const found = await media.findForReencode(row.mediaItemId);

    if (found === null) {
      await failWith(row.id, say('server.reencode.fileGone'));

      return;
    }

    const paths = reencodePathsFor(found.libraryPath, found.path, row.id);

    if (!(await canWriteInto(paths.directory))) {
      await failWith(row.id, say('server.reencode.cannotWrite'));

      return;
    }

    if (isBeingWatched(row.mediaItemId)) {
      await failWith(row.id, say('server.reencode.beingWatched'));

      return;
    }

    const planned = planReencodeSpec({
      item: found.item,
      settings: settingsOf(row),
      inputPath: found.path,
      capabilities: await capabilities(),
      forcedAccel: await forcedAccel(),
    });

    if (planned.kind === 'unsupported') {
      await failWith(row.id, planned.reason);

      return;
    }

    let answer = await transcoder.requestRendition({
      ...planned.request,
      durationSeconds: found.item.durationSeconds,
      outputPath: paths.output,
    });

    while (!answer.isReady && (answer.failure ?? null) === null) {
      if (isCancelled()) {
        await transcoder.stopRendition(paths.output);
        await db
          .update(reencodeRequest)
          .set({ state: 'queued', progress: 0, bytesPerSecond: null })
          .where(eq(reencodeRequest.id, row.id));

        return;
      }

      await wait(ASK_AGAIN_MS);

      await db
        .update(reencodeRequest)
        .set({ progress: answer.progress, bytesPerSecond: answer.bytesPerSecond ?? null })
        .where(eq(reencodeRequest.id, row.id));

      answer = await transcoder.requestRendition({
        ...planned.request,
        durationSeconds: found.item.durationSeconds,
        outputPath: paths.output,
      });
    }

    if ((answer.failure ?? null) !== null) {
      await failWith(row.id, answer.failure ?? say('server.reencode.failed'));

      return;
    }

    await db
      .update(reencodeRequest)
      .set({ state: 'verifying', progress: 100, bytesPerSecond: null })
      .where(eq(reencodeRequest.id, row.id));

    const facts = await readFacts(paths.output);

    if (row.mode === 'keep') {
      await db.insert(mediaRendition).values({
        id: randomUUID(),
        mediaItemId: row.mediaItemId,
        kind: 'pinned',
        path: paths.output,
        label: renditionLabel({
          width: facts.width,
          height: facts.height,
          videoCodec: facts.videoCodec,
        }),
        quality: row.quality,
        sizeBytes: facts.sizeBytes,
        container: facts.container,
        durationSeconds: facts.durationSeconds,
        bitrateKbps: facts.bitrateKbps ?? 1,
        videoCodec: facts.videoCodec,
        videoRange: facts.videoRange,
        videoRangeBase: facts.videoRangeBase,
        videoBitDepth: facts.videoBitDepth,
        canCopySegments: facts.canCopySegments,
        videoLevel: facts.videoLevel,
        videoFrameRate: facts.videoFrameRate,
        videoIsInterlaced: facts.videoIsInterlaced,
        videoRefFrames: facts.videoRefFrames,
        videoCodecTag: facts.videoCodecTag,
        videoPixelAspect: facts.videoPixelAspect,
        videoRotationDegrees: facts.videoRotationDegrees,
        width: facts.width,
        height: facts.height,
        audioStreams: facts.audioStreams,
        subtitleStreams: facts.subtitleStreams,
        createdBy: row.askedBy,
      });

      await db
        .update(reencodeRequest)
        .set({
          state: 'finished',
          producedBytes: facts.sizeBytes,
          encodedAt: new Date(),
          reviewedAt: new Date(),
        })
        .where(eq(reencodeRequest.id, row.id));

      await afterChange(row.mediaItemId);

      return;
    }

    await swapIntoPlace({
      originalPath: found.path,
      encodePath: paths.output,
      asidePath: paths.aside,
    });

    await writeFacts(row.mediaItemId, facts);

    await db
      .update(reencodeRequest)
      .set({
        state: 'awaitingReview',
        asidePath: paths.aside,
        producedBytes: facts.sizeBytes,
        encodedAt: new Date(),
      })
      .where(eq(reencodeRequest.id, row.id));

    await afterChange(row.mediaItemId);
  };

  return {
    estimate: async (mediaIds, settings) => {
      const { candidates } = await weigh(mediaIds, settings);
      const first = candidates[0];
      const nowBytes = candidates.reduce((total, one) => total + one.sizeBytes, 0);
      const added = candidates
        .filter((one) => one.refusal === null)
        .reduce((total, one) => total + (one.estimatedBytes ?? one.sizeBytes), 0);
      const kept = candidates
        .filter((one) => one.refusal !== null)
        .reduce((total, one) => total + one.sizeBytes, 0);

      const found = first === undefined ? null : await media.findForReencode(first.mediaId);

      return {
        candidates,
        nowBytes,
        afterBytes: settings.mode === 'keep' ? nowBytes + added : added + kept,
        freeBytes: found === null ? null : await freeBytesFor(found.path),
        committedBytes: await committedBytes(),
        awaitingReview: await awaitingReviewCount(),
        awaitingReviewCap: await awaitingReviewCap(),
      };
    },

    start: async (mediaIds, settings, askedBy) => {
      const { candidates, subjects } = await weigh(mediaIds, settings);
      const started: Reencode[] = [];
      const refused = candidates
        .filter((one) => one.refusal !== null)
        .map((one) => ({ mediaId: one.mediaId, refusal: one.refusal }))
        .flatMap((one) => (one.refusal === null ? [] : [{ ...one, refusal: one.refusal }]));

      for (const candidate of candidates) {
        const found = subjects.get(candidate.mediaId);

        if (candidate.refusal !== null || found === undefined) {
          continue;
        }

        const id = randomUUID();
        const paths = reencodePathsFor(found.libraryPath, found.path, id);
        const facts = await readFacts(found.path).catch(() => null);

        if (facts === null) {
          refused.push({
            mediaId: candidate.mediaId,
            refusal: { code: 'NotFound', detail: say('server.reencode.unreadable') },
          });

          continue;
        }

        const [row] = await db
          .insert(reencodeRequest)
          .values({
            id,
            mediaItemId: candidate.mediaId,
            libraryId: found.libraryId,
            mode: settings.mode,
            state: 'queued',
            quality: settings.quality,
            videoCodec: settings.videoCodec,
            audio: settings.audio,
            originalPath: found.path,
            originalSizeBytes: facts.sizeBytes,
            originalProbe: facts,
            workingPath: paths.output,
            estimatedBytes: candidate.estimatedBytes,
            askedBy,
          })
          .returning();

        if (row !== undefined) {
          started.push(
            asReencode(row, {
              title: found.title,
              seriesTitle: found.seriesTitle,
              durationSeconds: found.item.durationSeconds,
            }),
          );
        }
      }

      return { started, refused };
    },

    list: async () => {
      const rows = await db.select().from(reencodeRequest).orderBy(asc(reencodeRequest.askedAt));

      return Promise.all(rows.map(async (row) => asReencode(row, await titleFor(row))));
    },

    cancel: async (id) => {
      const rows = await db.select().from(reencodeRequest).where(eq(reencodeRequest.id, id));
      const row = rows[0];

      if (
        row === undefined ||
        !REENCODES_STILL_TO_BE_WRITTEN.some((state) => state === row.state)
      ) {
        return false;
      }

      await transcoder.stopRendition(row.workingPath).catch(() => false);
      await transcoder.forgetRendition(row.workingPath).catch(() => false);

      await db
        .update(reencodeRequest)
        .set({ state: 'cancelled', progress: 0, bytesPerSecond: null, reviewedAt: new Date() })
        .where(eq(reencodeRequest.id, id));

      return true;
    },

    confirm: async (id) => {
      const rows = await db.select().from(reencodeRequest).where(eq(reencodeRequest.id, id));
      const row = rows[0];

      if (row === undefined || row.state !== 'awaitingReview' || row.asidePath === null) {
        return false;
      }

      await rm(row.asidePath, { force: true });

      if (row.samplePath !== null) {
        await rm(row.samplePath, { force: true });
      }

      await db
        .update(reencodeRequest)
        .set({ state: 'finished', asidePath: null, samplePath: null, reviewedAt: new Date() })
        .where(eq(reencodeRequest.id, id));

      return true;
    },

    reject: async (id) => {
      const rows = await db.select().from(reencodeRequest).where(eq(reencodeRequest.id, id));
      const row = rows[0];

      if (row === undefined || row.state !== 'awaitingReview' || row.asidePath === null) {
        return false;
      }

      await restoreOriginal({ originalPath: row.originalPath, asidePath: row.asidePath });
      await writeFacts(row.mediaItemId, MediaFactsSchema.parse(row.originalProbe));

      if (row.samplePath !== null) {
        await rm(row.samplePath, { force: true });
      }

      await db
        .update(reencodeRequest)
        .set({
          state: 'rejected',
          asidePath: null,
          samplePath: null,
          producedBytes: null,
          reviewedAt: new Date(),
        })
        .where(eq(reencodeRequest.id, id));

      await afterChange(row.mediaItemId);

      return true;
    },

    sample: async (id) => {
      const rows = await db.select().from(reencodeRequest).where(eq(reencodeRequest.id, id));
      const row = rows[0];

      if (row === undefined) {
        return false;
      }

      const found = await media.findForReencode(row.mediaItemId);

      if (found === null) {
        return false;
      }

      const paths = reencodePathsFor(found.libraryPath, found.path, row.id);

      const planned = planReencodeSpec({
        item: found.item,
        settings: settingsOf(row),
        inputPath: found.path,
        capabilities: await capabilities(),
        forcedAccel: await forcedAccel(),
        keepsChapters: false,
      });

      if (planned.kind === 'unsupported') {
        return false;
      }

      await transcoder.requestRendition({
        ...planned.request,
        durationSeconds: found.item.durationSeconds,
        outputPath: paths.sample,
        fromSeconds: Math.floor(found.item.durationSeconds * A_SCENE_WITH_MOTION),
        forSeconds: SAMPLE_SECONDS,
      });

      await db
        .update(reencodeRequest)
        .set({ samplePath: paths.sample })
        .where(eq(reencodeRequest.id, id));

      return true;
    },

    frame: async (id, side, seconds, width) => {
      const rows = await db.select().from(reencodeRequest).where(eq(reencodeRequest.id, id));
      const row = rows[0];

      if (row === undefined) {
        return null;
      }

      const path = side === 'original' ? row.asidePath : row.originalPath;

      if (path === null) {
        return null;
      }

      return transcoder.readFrame({ inputPath: path, atSeconds: seconds, width }).catch(() => null);
    },

    renditionsFor: async (mediaId) => {
      const rows = await db
        .select()
        .from(mediaRendition)
        .where(eq(mediaRendition.mediaItemId, mediaId))
        .orderBy(asc(mediaRendition.createdAt));

      return rows.map((row): Rendition =>
        RenditionSchema.parse({ ...row, createdAt: row.createdAt.toISOString() }),
      );
    },

    removeRendition: async (id) => {
      const rows = await db.select().from(mediaRendition).where(eq(mediaRendition.id, id));
      const row = rows[0];

      if (row === undefined) {
        return false;
      }

      await transcoder.forgetRendition(row.path).catch(() => false);
      await db.delete(mediaRendition).where(eq(mediaRendition.id, id));

      return true;
    },

    work: async (onProgress, isCancelled) => {
      await pickUpWhereItWasLeft();

      const cap = await awaitingReviewCap();
      let done = 0;

      for (;;) {
        if (isCancelled() || (await awaitingReviewCount()) >= cap) {
          return;
        }

        const row = await claimTheNextOne();

        if (row === undefined) {
          return;
        }

        const waiting = await db
          .select({ counted: sql<number>`count(*)::int` })
          .from(reencodeRequest)
          .where(eq(reencodeRequest.state, 'queued'));

        onProgress(done, done + 1 + (waiting[0]?.counted ?? 0));

        await encode(row, isCancelled).catch(async (error: Error) => {
          await failWith(row.id, error.message);
        });

        done += 1;
      }
    },
  };
};

export type { CreateDatabaseReencodeServiceOptions, ReencodeMedia, ReencodeSubject };

export { createDatabaseReencodeService };
