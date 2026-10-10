import {
  and,
  asc,
  count,
  countDistinct,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  notExists,
  notInArray,
  sql,
} from 'drizzle-orm';
import { upsert } from '@ValenceDatabase/upsert';
import { isWithinHours } from '@ValenceCore/functions/isWithinHours';
import { needsPreTranscode } from '@ValenceCore/functions/needsPreTranscode';
import {
  library,
  mediaItem,
  mediaRendition,
  preTranscodeRefusal,
  reencodeRequest,
} from '#dialect/Schema';
import {
  REENCODES_STILL_TO_BE_WRITTEN,
  REENCODES_UNDER_WAY,
} from '@ValenceContracts/schemas/Reencode';
import { PRE_TRANSCODE_QUALITIES } from '@ValenceContracts/schemas/PreTranscoding';
import { localHourOf } from './localHourOf';
import { preTranscodeTargetOf } from './preTranscodeTargetOf';
import type { SQL } from 'drizzle-orm';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type {
  PreTranscodeTarget,
  PreTranscodeTargetProgress,
  PreTranscodingSettings,
  PreTranscodingStatus,
} from '@ValenceContracts/schemas/PreTranscoding';
import type { ReencodeRefusal } from '@ValenceContracts/schemas/Reencode';
import type { ReencodeService } from '@ValenceServer/reencode/ReencodeService';
import type { PreTranscodeTick, PreTranscodingService } from './PreTranscodingService';

const PAGE = 200;

const MOST_TRIES_A_TICK = 20;

const FAILURES_BEFORE_GIVING_UP = 2;

const VIDEO_LIBRARY_KINDS = ['movies', 'shows', 'anime'];

const REFUSALS_THAT_PASS: readonly string[] = ['BeingWatched', 'AlreadyUnderWay'];

const REPLACEMENTS_MADE = ['awaitingReview', 'finished'] as const;

type Rung = {
  target: PreTranscodeTarget;
  mode: 'keep' | 'replace';
};

/**
 * The rungs of a ladder in the order they are made, each with whether its copy is kept beside the
 * original or takes its place. Where the original is not kept, the tallest rung replaces it and is
 * made last, so every other rung is made from the original rather than from a copy of it.
 *
 * @param chosen - The pre-transcoding settings.
 * @returns The rungs, in the order they are worked through.
 */
const rungsOf = (chosen: PreTranscodingSettings): Rung[] => {
  if (chosen.keepsOriginal) {
    return chosen.targets.map((target) => ({ target, mode: 'keep' }));
  }

  const tallest = chosen.targets.reduce<PreTranscodeTarget | null>(
    (best, target) =>
      best === null ||
      PRE_TRANSCODE_QUALITIES.indexOf(target.quality) <
        PRE_TRANSCODE_QUALITIES.indexOf(best.quality)
        ? target
        : best,
    null,
  );

  return [
    ...chosen.targets
      .filter((target) => target !== tallest)
      .map((target): Rung => ({ target, mode: 'keep' })),
    ...(tallest === null ? [] : [{ target: tallest, mode: 'replace' as const }]),
  ];
};

type CreatePreTranscodingServiceOptions = {
  db: AnyValenceDatabase;
  reencodes: ReencodeService;
  settings: {
    read: () => Promise<PreTranscodingSettings>;
    write: (next: PreTranscodingSettings) => Promise<void>;
  };
  timezone: () => Promise<string>;
  onQueued: () => void;
  now?: () => Date;
};

/**
 * Pre-transcoding: working through the video libraries one film or episode at a time, keeping
 * beside each one a ladder of copies — one for every rung the administrator chose that the original
 * stands above — so a modest device, or a slow connection, has something it plays untouched, in the
 * hours an administrator chose. The rungs are worked in the order they were listed, each through
 * the whole library before the next.
 *
 * Every copy is an ordinary re-encode kept alongside, asked for with `preTranscode` as its origin,
 * so the one queue makes it, the one rendition table remembers it and playback already prefers it.
 * This decides only what to ask for next and when: never while one of its own is under way, never
 * outside the window, and never for a file the copy would not improve. What it queued stops when
 * the window closes, so nothing runs into the day. A file refused at a rung, or failed there twice,
 * is passed over at that rung until the copy asked for changes or the settings are saved again.
 *
 * The files are walked in the order of their identifiers from where the last one was taken, so a
 * library of thousands is not read from the top on every tick.
 *
 * @param options - The database, the re-encoder, where the settings live, which clock the window
 *   keeps, and what to call once something is queued.
 * @returns The service.
 */
const createPreTranscodingService = ({
  db,
  reencodes,
  settings,
  timezone,
  onQueued,
  now = () => new Date(),
}: CreatePreTranscodingServiceOptions): PreTranscodingService => {
  const cursors = new Map<string, string>();

  const asTarget = ({ target, mode }: Rung): SQL | undefined =>
    and(
      eq(reencodeRequest.origin, 'preTranscode'),
      eq(reencodeRequest.mode, mode),
      eq(reencodeRequest.quality, target.quality),
      eq(reencodeRequest.videoCodec, target.videoCodec),
      eq(reencodeRequest.container, target.container),
    );

  const keptAs = ({ target, mode }: Rung): SQL | undefined =>
    and(
      eq(reencodeRequest.mode, mode),
      mode === 'keep'
        ? eq(reencodeRequest.state, 'finished')
        : inArray(reencodeRequest.state, [...REPLACEMENTS_MADE]),
      eq(reencodeRequest.quality, target.quality),
      eq(reencodeRequest.videoCodec, target.videoCodec),
      eq(reencodeRequest.container, target.container),
    );

  const failedTwice = (rung: Rung) =>
    db
      .select({ mediaItemId: reencodeRequest.mediaItemId })
      .from(reencodeRequest)
      .where(and(asTarget(rung), eq(reencodeRequest.state, 'failed')))
      .groupBy(reencodeRequest.mediaItemId)
      .having(gte(count(), FAILURES_BEFORE_GIVING_UP));

  const inScope = (chosen: PreTranscodingSettings): SQL | undefined =>
    and(
      inArray(library.kind, VIDEO_LIBRARY_KINDS),
      chosen.libraryIds === null
        ? undefined
        : chosen.libraryIds.length === 0
          ? sql`1 = 0`
          : inArray(mediaItem.libraryId, chosen.libraryIds),
      isNull(mediaItem.extraKind),
      gt(mediaItem.height, 0),
    );

  const alreadyMade = (rung: Rung): SQL =>
    rung.mode === 'keep'
      ? notExists(
          db
            .select({ one: sql`1` })
            .from(reencodeRequest)
            .innerJoin(mediaRendition, eq(mediaRendition.path, reencodeRequest.workingPath))
            .where(and(eq(reencodeRequest.mediaItemId, mediaItem.id), keptAs(rung))),
        )
      : notExists(
          db
            .select({ one: sql`1` })
            .from(reencodeRequest)
            .where(
              and(
                eq(reencodeRequest.mediaItemId, mediaItem.id),
                asTarget(rung),
                eq(reencodeRequest.state, 'rejected'),
              ),
            ),
        );

  const stillWanting = (chosen: PreTranscodingSettings, rung: Rung): SQL | undefined => {
    const { key } = preTranscodeTargetOf(rung.target, rung.mode);

    return and(
      inScope(chosen),
      alreadyMade(rung),
      notExists(
        db
          .select({ one: sql`1` })
          .from(reencodeRequest)
          .where(
            and(
              eq(reencodeRequest.mediaItemId, mediaItem.id),
              inArray(reencodeRequest.state, [...REENCODES_UNDER_WAY]),
            ),
          ),
      ),
      notExists(
        db
          .select({ one: sql`1` })
          .from(preTranscodeRefusal)
          .where(
            and(
              eq(preTranscodeRefusal.mediaItemId, mediaItem.id),
              eq(preTranscodeRefusal.target, key),
            ),
          ),
      ),
      notInArray(mediaItem.id, failedTwice(rung)),
    );
  };

  const pageFrom = (chosen: PreTranscodingSettings, rung: Rung, after: string) =>
    db
      .select({
        id: mediaItem.id,
        height: mediaItem.height,
        bitrateKbps: mediaItem.bitrateKbps,
        videoCodec: mediaItem.videoCodec,
        videoFrameRate: mediaItem.videoFrameRate,
      })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(and(stillWanting(chosen, rung), gt(mediaItem.id, after)))
      .orderBy(asc(mediaItem.id))
      .limit(PAGE);

  const wouldImprove = (
    { target }: Rung,
    row: {
      height: number;
      bitrateKbps: number | null;
      videoCodec: string;
      videoFrameRate: number | null;
    },
  ): boolean =>
    needsPreTranscode(
      { ...row, bitrateKbps: row.bitrateKbps ?? 0 },
      {
        quality: target.quality,
        videoCodec: target.videoCodec,
        maxBitrateKbps: target.maxBitrateKbps,
      },
    );

  const nextAfter = async (
    chosen: PreTranscodingSettings,
    rung: Rung,
    after: string,
    passed: ReadonlySet<string>,
  ): Promise<string | null> => {
    for (let from = after; ;) {
      const rows = await pageFrom(chosen, rung, from);
      const found = rows.find((row) => !passed.has(row.id) && wouldImprove(rung, row));

      if (found !== undefined) {
        return found.id;
      }

      const last = rows.at(-1);

      if (last === undefined || rows.length < PAGE) {
        return null;
      }

      from = last.id;
    }
  };

  const findNext = async (
    chosen: PreTranscodingSettings,
    rung: Rung,
    passed: ReadonlySet<string>,
  ): Promise<string | null> => {
    const cursor = cursors.get(preTranscodeTargetOf(rung.target, rung.mode).key) ?? '';

    return (
      (await nextAfter(chosen, rung, cursor, passed)) ??
      (cursor === '' ? null : await nextAfter(chosen, rung, '', passed))
    );
  };

  const countStillNeeded = async (chosen: PreTranscodingSettings, rung: Rung): Promise<number> => {
    let needed = 0;

    for (let from = ''; ;) {
      const rows = await pageFrom(chosen, rung, from);

      needed += rows.filter((row) => wouldImprove(rung, row)).length;

      const last = rows.at(-1);

      if (last === undefined || rows.length < PAGE) {
        return needed;
      }

      from = last.id;
    }
  };

  const ownUnderWay = async (onlyScheduled: boolean): Promise<string[]> => {
    const rows = await db
      .select({ id: reencodeRequest.id })
      .from(reencodeRequest)
      .where(
        and(
          eq(reencodeRequest.origin, 'preTranscode'),
          inArray(reencodeRequest.state, [...REENCODES_STILL_TO_BE_WRITTEN]),
          onlyScheduled ? isNull(reencodeRequest.askedBy) : undefined,
        ),
      );

    return rows.map((row) => row.id);
  };

  const cancelOwn = async (onlyScheduled: boolean): Promise<number> => {
    const ids = await ownUnderWay(onlyScheduled);

    for (const id of ids) {
      await reencodes.cancel(id);
    }

    return ids.length;
  };

  const remember = async (
    mediaItemId: string,
    key: string,
    { code, detail }: ReencodeRefusal,
  ): Promise<void> => {
    await upsert(db, preTranscodeRefusal, {
      values: [{ mediaItemId, target: key, code, detail, refusedAt: now() }],
      target: [preTranscodeRefusal.mediaItemId, preTranscodeRefusal.target],
      set: { code, detail, refusedAt: now() },
    });
  };

  const queueNextAt = async (
    chosen: PreTranscodingSettings,
    rung: Rung,
    askedBy: string | null,
  ): Promise<PreTranscodeTick> => {
    const request = preTranscodeTargetOf(rung.target, rung.mode);
    const passed = new Set<string>();

    for (let tries = 0; tries < MOST_TRIES_A_TICK; tries += 1) {
      const mediaId = await findNext(chosen, rung, passed);

      if (mediaId === null) {
        cursors.delete(request.key);

        return { kind: 'nothingLeft' };
      }

      const { started, refused } = await reencodes.start(
        [mediaId],
        request.settings,
        askedBy,
        'preTranscode',
      );

      cursors.set(request.key, mediaId);

      if (started.length > 0) {
        onQueued();

        return { kind: 'queued', mediaId };
      }

      passed.add(mediaId);

      const refusal = refused[0]?.refusal;

      if (refusal !== undefined && !REFUSALS_THAT_PASS.includes(refusal.code)) {
        await remember(mediaId, request.key, refusal);
      }
    }

    return { kind: 'nothingLeft' };
  };

  const queueNext = async (
    chosen: PreTranscodingSettings,
    askedBy: string | null,
  ): Promise<PreTranscodeTick> => {
    for (const rung of rungsOf(chosen)) {
      const ticked = await queueNextAt(chosen, rung, askedBy);

      if (ticked.kind !== 'nothingLeft') {
        return ticked;
      }
    }

    return { kind: 'nothingLeft' };
  };

  const progressAt = async (
    chosen: PreTranscodingSettings,
    rung: Rung,
  ): Promise<PreTranscodeTargetProgress> => {
    const { key } = preTranscodeTargetOf(rung.target, rung.mode);

    const [made] =
      rung.mode === 'keep'
        ? await db
            .select({ counted: countDistinct(reencodeRequest.mediaItemId) })
            .from(reencodeRequest)
            .innerJoin(mediaRendition, eq(mediaRendition.path, reencodeRequest.workingPath))
            .where(keptAs(rung))
        : await db
            .select({ counted: countDistinct(reencodeRequest.mediaItemId) })
            .from(reencodeRequest)
            .where(and(eq(reencodeRequest.origin, 'preTranscode'), keptAs(rung)));

    const [refusedCount] = await db
      .select({ counted: count() })
      .from(preTranscodeRefusal)
      .where(eq(preTranscodeRefusal.target, key));

    const [kept] =
      rung.mode === 'keep'
        ? await db
            .select({
              bytes: sql<number>`coalesce(sum(${mediaRendition.sizeBytes}), 0)`.mapWith(Number),
            })
            .from(mediaRendition)
            .where(
              inArray(
                mediaRendition.path,
                db
                  .select({ path: reencodeRequest.workingPath })
                  .from(reencodeRequest)
                  .where(keptAs(rung)),
              ),
            )
        : await db
            .select({
              bytes: sql<number>`coalesce(sum(${reencodeRequest.producedBytes}), 0)`.mapWith(
                Number,
              ),
            })
            .from(reencodeRequest)
            .where(and(eq(reencodeRequest.origin, 'preTranscode'), keptAs(rung)));

    const failed = await failedTwice(rung);

    return {
      target: rung.target,
      replacesOriginal: rung.mode === 'replace',
      copiesMade: made?.counted ?? 0,
      bytesKept: kept?.bytes ?? 0,
      stillNeeded: await countStillNeeded(chosen, rung),
      givenUp: (refusedCount?.counted ?? 0) + failed.length,
    };
  };

  const keysOf = (chosen: PreTranscodingSettings): string =>
    rungsOf(chosen)
      .map((rung) => preTranscodeTargetOf(rung.target, rung.mode).key)
      .join('|');

  const isInTheWindow = async (chosen: PreTranscodingSettings): Promise<boolean> =>
    chosen.schedule === 'untilDone' ||
    isWithinHours(
      localHourOf(now(), await timezone()),
      chosen.windowStartHour,
      chosen.windowEndHour,
    );

  const status = async (): Promise<PreTranscodingStatus> => {
    const chosen = await settings.read();
    const ladder: PreTranscodeTargetProgress[] = [];

    for (const rung of rungsOf(chosen)) {
      ladder.push(await progressAt(chosen, rung));
    }

    const total = (of: (rung: PreTranscodeTargetProgress) => number): number =>
      ladder.reduce((sum, rung) => sum + of(rung), 0);

    const current =
      (await reencodes.list()).find(
        (one) =>
          one.origin === 'preTranscode' &&
          REENCODES_STILL_TO_BE_WRITTEN.some((state) => state === one.state),
      ) ?? null;

    return {
      settings: chosen,
      copiesMade: total((rung) => rung.copiesMade),
      stillNeeded: total((rung) => rung.stillNeeded),
      givenUp: total((rung) => rung.givenUp),
      ladder,
      current,
      isInWindow: await isInTheWindow(chosen),
      timezone: await timezone(),
    };
  };

  return {
    status,

    save: async (next) => {
      const before = await settings.read();
      const wasSame =
        keysOf(before) === keysOf(next) &&
        JSON.stringify(before.libraryIds) === JSON.stringify(next.libraryIds);

      await settings.write(next);
      await db.delete(preTranscodeRefusal);

      cursors.clear();

      if (!next.isEnabled || next.isPaused || !wasSame) {
        await cancelOwn(false);
      }

      return status();
    },

    runNow: async (askedBy) => {
      const chosen = await settings.read();

      if (!chosen.isEnabled) {
        return false;
      }

      if ((await ownUnderWay(false)).length > 0) {
        onQueued();

        return true;
      }

      return (await queueNext(chosen, askedBy)).kind === 'queued';
    },

    tick: async () => {
      const chosen = await settings.read();

      if (!chosen.isEnabled) {
        return { kind: 'off' };
      }

      if (chosen.isPaused) {
        return { kind: 'paused' };
      }

      if (!(await isInTheWindow(chosen))) {
        return { kind: 'outsideTheWindow', cancelled: await cancelOwn(true) };
      }

      if ((await ownUnderWay(false)).length > 0) {
        onQueued();

        return { kind: 'underWay' };
      }

      return queueNext(chosen, null);
    },
  };
};

export type { CreatePreTranscodingServiceOptions };

export { createPreTranscodingService };
