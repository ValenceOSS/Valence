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

  const asTarget = (chosen: PreTranscodeTarget): SQL | undefined =>
    and(
      eq(reencodeRequest.origin, 'preTranscode'),
      eq(reencodeRequest.mode, 'keep'),
      eq(reencodeRequest.quality, chosen.quality),
      eq(reencodeRequest.videoCodec, chosen.videoCodec),
      eq(reencodeRequest.container, chosen.container),
    );

  const keptAs = (chosen: PreTranscodeTarget): SQL | undefined =>
    and(
      eq(reencodeRequest.mode, 'keep'),
      eq(reencodeRequest.state, 'finished'),
      eq(reencodeRequest.quality, chosen.quality),
      eq(reencodeRequest.videoCodec, chosen.videoCodec),
      eq(reencodeRequest.container, chosen.container),
    );

  const failedTwice = (chosen: PreTranscodeTarget) =>
    db
      .select({ mediaItemId: reencodeRequest.mediaItemId })
      .from(reencodeRequest)
      .where(and(asTarget(chosen), eq(reencodeRequest.state, 'failed')))
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

  const stillWanting = (
    chosen: PreTranscodingSettings,
    target: PreTranscodeTarget,
  ): SQL | undefined => {
    const { key } = preTranscodeTargetOf(target);

    return and(
      inScope(chosen),
      notExists(
        db
          .select({ one: sql`1` })
          .from(reencodeRequest)
          .innerJoin(mediaRendition, eq(mediaRendition.path, reencodeRequest.workingPath))
          .where(and(eq(reencodeRequest.mediaItemId, mediaItem.id), keptAs(target))),
      ),
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
      notInArray(mediaItem.id, failedTwice(target)),
    );
  };

  const pageFrom = (chosen: PreTranscodingSettings, target: PreTranscodeTarget, after: string) =>
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
      .where(and(stillWanting(chosen, target), gt(mediaItem.id, after)))
      .orderBy(asc(mediaItem.id))
      .limit(PAGE);

  const wouldImprove = (
    target: PreTranscodeTarget,
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
    target: PreTranscodeTarget,
    after: string,
    passed: ReadonlySet<string>,
  ): Promise<string | null> => {
    for (let from = after; ;) {
      const rows = await pageFrom(chosen, target, from);
      const found = rows.find((row) => !passed.has(row.id) && wouldImprove(target, row));

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
    target: PreTranscodeTarget,
    passed: ReadonlySet<string>,
  ): Promise<string | null> => {
    const cursor = cursors.get(preTranscodeTargetOf(target).key) ?? '';

    return (
      (await nextAfter(chosen, target, cursor, passed)) ??
      (cursor === '' ? null : await nextAfter(chosen, target, '', passed))
    );
  };

  const countStillNeeded = async (
    chosen: PreTranscodingSettings,
    target: PreTranscodeTarget,
  ): Promise<number> => {
    let needed = 0;

    for (let from = ''; ;) {
      const rows = await pageFrom(chosen, target, from);

      needed += rows.filter((row) => wouldImprove(target, row)).length;

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
    rung: PreTranscodeTarget,
    askedBy: string | null,
  ): Promise<PreTranscodeTick> => {
    const target = preTranscodeTargetOf(rung);
    const passed = new Set<string>();

    for (let tries = 0; tries < MOST_TRIES_A_TICK; tries += 1) {
      const mediaId = await findNext(chosen, rung, passed);

      if (mediaId === null) {
        cursors.delete(target.key);

        return { kind: 'nothingLeft' };
      }

      const { started, refused } = await reencodes.start(
        [mediaId],
        target.settings,
        askedBy,
        'preTranscode',
      );

      cursors.set(target.key, mediaId);

      if (started.length > 0) {
        onQueued();

        return { kind: 'queued', mediaId };
      }

      passed.add(mediaId);

      const refusal = refused[0]?.refusal;

      if (refusal !== undefined && !REFUSALS_THAT_PASS.includes(refusal.code)) {
        await remember(mediaId, target.key, refusal);
      }
    }

    return { kind: 'nothingLeft' };
  };

  const queueNext = async (
    chosen: PreTranscodingSettings,
    askedBy: string | null,
  ): Promise<PreTranscodeTick> => {
    for (const rung of chosen.targets) {
      const ticked = await queueNextAt(chosen, rung, askedBy);

      if (ticked.kind !== 'nothingLeft') {
        return ticked;
      }
    }

    return { kind: 'nothingLeft' };
  };

  const progressAt = async (
    chosen: PreTranscodingSettings,
    target: PreTranscodeTarget,
  ): Promise<PreTranscodeTargetProgress> => {
    const { key } = preTranscodeTargetOf(target);

    const [made] = await db
      .select({ counted: countDistinct(reencodeRequest.mediaItemId) })
      .from(reencodeRequest)
      .innerJoin(mediaRendition, eq(mediaRendition.path, reencodeRequest.workingPath))
      .where(keptAs(target));

    const [refusedCount] = await db
      .select({ counted: count() })
      .from(preTranscodeRefusal)
      .where(eq(preTranscodeRefusal.target, key));

    const [kept] = await db
      .select({ bytes: sql<number>`coalesce(sum(${mediaRendition.sizeBytes}), 0)`.mapWith(Number) })
      .from(mediaRendition)
      .where(
        inArray(
          mediaRendition.path,
          db
            .select({ path: reencodeRequest.workingPath })
            .from(reencodeRequest)
            .where(keptAs(target)),
        ),
      );

    const failed = await failedTwice(target);

    return {
      target,
      copiesMade: made?.counted ?? 0,
      bytesKept: kept?.bytes ?? 0,
      stillNeeded: await countStillNeeded(chosen, target),
      givenUp: (refusedCount?.counted ?? 0) + failed.length,
    };
  };

  const keysOf = (chosen: PreTranscodingSettings): string =>
    chosen.targets.map((target) => preTranscodeTargetOf(target).key).join('|');

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

    for (const target of chosen.targets) {
      ladder.push(await progressAt(chosen, target));
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
