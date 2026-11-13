import { mkdir, readdir, rename, stat } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, sep } from 'node:path';
import { and, count, eq, gt, inArray, isNotNull, isNull, like, sql } from 'drizzle-orm';
import { concatenated } from '@ValenceDatabase/concatenated';
import { likeLiterally } from '@ValenceDatabase/likeLiterally';
import {
  episodePin,
  extraChoice,
  library,
  mediaItem,
  mediaLeftOut,
  mediaOverride,
  mediaPart,
  mediaPreviewOverride,
  versionChoice,
} from '#dialect/Schema';
import { moveFile } from '@ValenceServer/files/moveFile';
import { isSidecarOf } from '@ValenceServer/library/isSidecarOf';
import { removeEmptyFoldersUpTo } from '@ValenceServer/library/removeEmptyFoldersUpTo';
import { idTagOf } from '@ValenceServer/rename/idTagOf';
import { patternPathOf } from '@ValenceServer/rename/patternPathOf';
import { tailAfterYearOf } from '@ValenceServer/rename/tailAfterYearOf';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type {
  PatternRenamePlan,
  PatternRenameResult,
  PatternRenameState,
} from '@ValenceContracts/schemas/PatternRename';
import type { SQLWrapper } from 'drizzle-orm';

type PlannedFile = PatternRenamePlan['files'][number] & { libraryId: string; root: string };

type PatternRenameDependencies = {
  db: AnyValenceDatabase;
  queueReadAgain: (
    libraryId: string,
    paths: string[],
    keepsMatches: boolean,
  ) => Promise<string | null>;
};

/**
 * Whether something other than the file itself is already at a path. A name that differs from the
 * file's only in its capitals is the file itself on a disk that does not tell capitals apart.
 *
 * @param from - The file.
 * @param to - Where it would go.
 * @returns Whether something else is there.
 */
const isTakenBesides = async (from: string, to: string): Promise<boolean> => {
  const [there, here] = await Promise.all([
    stat(to).catch(() => null),
    stat(from).catch(() => null),
  ]);

  return there !== null && (here === null || there.ino !== here.ino || there.dev !== here.dev);
};

/**
 * A free name beside a taken one, numbered as a further copy is: `Name - 2`, then `Name - 3`.
 *
 * @param to - The taken name.
 * @param claimed - Names already given out, in lower case.
 * @returns The first one free on the disk and not already given out.
 */
const numberedPathOf = async (to: string, claimed: ReadonlySet<string>): Promise<string> => {
  const extension = extname(to);
  const stem = to.slice(0, to.length - extension.length);

  for (let number = 2; ; number += 1) {
    const candidate = `${stem} - ${number.toString()}${extension}`;

    if (
      !claimed.has(candidate.toLowerCase()) &&
      (await stat(candidate).catch(() => null)) === null
    ) {
      return candidate;
    }
  }
};

/**
 * Renames films and episodes to the library's naming pattern: plans where each file would go, and
 * moves the ones asked for there with what is kept beside them, so every choice made for them and
 * everything viewers have of them goes with them.
 *
 * A folder that holds only what is being renamed is renamed whole, so artwork, an `.nfo` and extras
 * kept in it go along; otherwise each file moves out of it alone. A lone film keeps what its name
 * said after its year, its quality or edition, as Valence's requests name a film. A file already where it belongs
 * is left, as is an extra, which goes only with its film's folder, one not matched to the
 * catalogue, whose name would only be guessed, and a film kept as several files.
 *
 * @param dependencies - The database, and how to read files again once they have moved.
 * @returns How to plan the renames, and how to make them.
 */
const createPatternRenames = ({ db, queueReadAgain }: PatternRenameDependencies) => {
  /**
   * Moves every record kept by path from one folder to another, as a folder is renamed.
   *
   * @param libraryId - The library the folder is in.
   * @param from - The folder's old path.
   * @param to - Its new one.
   */
  const rebaseFolder = async (libraryId: string, from: string, to: string) => {
    const under = `${likeLiterally(`${from}${sep}`)}%`;
    const tail = sql.raw((Array.from(from).length + 1).toString());
    const moved = (column: SQLWrapper) => concatenated(to, sql`substr(${column}, ${tail})`);

    await db.transaction(async (tx) => {
      await tx
        .update(mediaItem)
        .set({ path: moved(mediaItem.path) })
        .where(and(eq(mediaItem.libraryId, libraryId), like(mediaItem.path, under)));
      await tx
        .update(mediaPart)
        .set({ path: moved(mediaPart.path) })
        .where(like(mediaPart.path, under));

      for (const table of [
        mediaOverride,
        mediaLeftOut,
        mediaPreviewOverride,
        episodePin,
        versionChoice,
      ]) {
        await tx
          .update(table)
          .set({ path: moved(table.path) })
          .where(and(eq(table.libraryId, libraryId), like(table.path, under)));
      }

      await tx
        .update(extraChoice)
        .set({ path: moved(extraChoice.path) })
        .where(and(eq(extraChoice.libraryId, libraryId), like(extraChoice.path, under)));
      await tx
        .update(extraChoice)
        .set({ parentPath: moved(extraChoice.parentPath) })
        .where(and(eq(extraChoice.libraryId, libraryId), like(extraChoice.parentPath, under)));
    });
  };

  /**
   * Moves every record kept by path for one file to its new path.
   *
   * @param libraryId - The library it is in.
   * @param mediaId - The file.
   * @param from - Its old path.
   * @param to - Its new one.
   */
  const repathFile = async (libraryId: string, mediaId: string, from: string, to: string) => {
    await db.transaction(async (tx) => {
      await tx.update(mediaItem).set({ path: to }).where(eq(mediaItem.id, mediaId));
      await tx.update(mediaPart).set({ path: to }).where(eq(mediaPart.mediaItemId, mediaId));

      for (const table of [
        mediaOverride,
        mediaLeftOut,
        mediaPreviewOverride,
        episodePin,
        versionChoice,
      ]) {
        await tx
          .update(table)
          .set({ path: to })
          .where(and(eq(table.libraryId, libraryId), eq(table.path, from)));
      }

      await tx
        .update(extraChoice)
        .set({ path: to })
        .where(and(eq(extraChoice.libraryId, libraryId), eq(extraChoice.path, from)));
      await tx
        .update(extraChoice)
        .set({ parentPath: to })
        .where(and(eq(extraChoice.libraryId, libraryId), eq(extraChoice.parentPath, from)));
    });
  };

  /**
   * Where each file would go under the pattern, and whether it can.
   *
   * @param mediaIds - The files.
   * @returns Each file found, in the order of its path. A film's standing version claims its name
   *   before the versions hung from it, so it is the one a clash leaves unnumbered, and otherwise
   *   files claim names in the order of their paths, whatever order the database finds them in.
   */
  const planFiles = async (mediaIds: readonly string[]): Promise<PlannedFile[]> => {
    const rows = await db
      .select({
        id: mediaItem.id,
        libraryId: mediaItem.libraryId,
        path: mediaItem.path,
        title: mediaItem.title,
        year: mediaItem.year,
        versionLabel: mediaItem.versionLabel,
        parentId: mediaItem.parentId,
        extraKind: mediaItem.extraKind,
        seriesId: mediaItem.seriesId,
        seriesTitle: mediaItem.seriesTitle,
        seasonNumber: mediaItem.seasonNumber,
        episodeNumber: mediaItem.episodeNumber,
        episodeNumberEnd: mediaItem.episodeNumberEnd,
        externalId: mediaItem.externalId,
      })
      .from(mediaItem)
      .where(and(inArray(mediaItem.id, [...mediaIds]), isNull(mediaItem.missingSince)));

    if (rows.length === 0) {
      return [];
    }

    const ids = rows.map((row) => row.id);
    const seriesIds = [
      ...new Set(rows.flatMap((row) => (row.seriesId === null ? [] : [row.seriesId]))),
    ];
    const [libraries, parts, versioned, seriesYears] = await Promise.all([
      db
        .select({ id: library.id, path: library.path })
        .from(library)
        .where(inArray(library.id, [...new Set(rows.map((row) => row.libraryId))])),
      db
        .select({ id: mediaPart.mediaItemId, parts: count() })
        .from(mediaPart)
        .where(inArray(mediaPart.mediaItemId, ids))
        .groupBy(mediaPart.mediaItemId),
      db
        .selectDistinct({ id: mediaItem.parentId })
        .from(mediaItem)
        .where(and(inArray(mediaItem.parentId, ids), isNull(mediaItem.extraKind))),
      seriesIds.length === 0
        ? Promise.resolve([])
        : db
            .select({ id: mediaItem.seriesId, year: sql<number | null>`min(${mediaItem.year})` })
            .from(mediaItem)
            .where(
              and(
                inArray(mediaItem.seriesId, seriesIds),
                gt(mediaItem.seasonNumber, 0),
                isNotNull(mediaItem.year),
              ),
            )
            .groupBy(mediaItem.seriesId),
    ]);
    const rootOf = new Map(libraries.map((one) => [one.id, one.path]));
    const isInParts = new Set(parts.filter((one) => one.parts > 1).map((one) => one.id));
    const hasVersions = new Set(versioned.map((one) => one.id));
    const yearOfSeries = new Map(
      seriesYears.map((one) => [one.id, one.year === null ? null : Number(one.year)]),
    );
    const besides = new Map<string, Promise<string[]>>();
    const claimed = new Set<string>();
    const planned: PlannedFile[] = [];

    for (const row of rows.toSorted(
      (one, other) =>
        Number(one.parentId !== null) - Number(other.parentId !== null) ||
        one.path.localeCompare(other.path),
    )) {
      const root = rootOf.get(row.libraryId);

      if (root === undefined) {
        continue;
      }

      const folders = relative(root, row.path).split(sep);
      const isEpisode =
        row.seriesId !== null && row.seasonNumber !== null && row.episodeNumber !== null;
      const isVersioned = row.parentId !== null || hasVersions.has(row.id);
      const tail = isEpisode
        ? null
        : tailAfterYearOf(basename(row.path, extname(row.path)), row.year);
      const to = patternPathOf({
        libraryPath: root,
        extension: extname(row.path).slice(1),
        title: row.title,
        year: row.year,
        versionLabel: isEpisode
          ? null
          : isVersioned
            ? row.versionLabel
            : tail?.isDashed === true
              ? tail.text
              : null,
        quality: isEpisode || isVersioned || tail === null || tail.isDashed ? null : tail.text,
        idTag: folders.length > 1 ? idTagOf(folders[0] ?? '') : null,
        series:
          isEpisode && row.seasonNumber !== null && row.episodeNumber !== null
            ? {
                title: row.seriesTitle ?? row.title,
                year: (row.seriesId === null ? null : yearOfSeries.get(row.seriesId)) ?? row.year,
                season: row.seasonNumber,
                episode: row.episodeNumber,
                lastEpisode: row.episodeNumberEnd,
              }
            : null,
      });
      const state: PatternRenameState =
        row.extraKind !== null
          ? 'extra'
          : row.externalId === null
            ? 'unmatched'
            : isInParts.has(row.id)
              ? 'parts'
              : to === row.path
                ? 'same'
                : claimed.has(to.toLowerCase()) || (await isTakenBesides(row.path, to))
                  ? 'taken'
                  : 'ready';
      const folder = dirname(row.path);
      const beside = besides.get(folder) ?? readdir(folder).catch((): string[] => []);
      const stem = basename(row.path, extname(row.path));

      besides.set(folder, beside);
      claimed.add((state === 'ready' || state === 'same' ? to : row.path).toLowerCase());
      planned.push({
        mediaId: row.id,
        libraryId: row.libraryId,
        root,
        from: row.path,
        to: state === 'ready' || state === 'taken' ? to : row.path,
        sidecars: (await beside).filter((name) => isSidecarOf(name, stem)).length,
        state,
      });
    }

    return planned.toSorted((one, other) => one.from.localeCompare(other.from));
  };

  /**
   * Renames the folders at one depth under a library's folder that hold only what is moving, each
   * to the one folder everything in it is going to.
   *
   * @param libraryId - The library.
   * @param root - Its folder.
   * @param depth - How far under it: a title's folder is one, a season's two.
   * @param moving - What is moving, by file, from where it is now to where it goes.
   * @returns The folders renamed, by their new paths.
   */
  const renameFolders = async (
    libraryId: string,
    root: string,
    depth: number,
    moving: Map<string, { now: string; to: string }>,
  ): Promise<string[]> => {
    const targets = new Map<string, Set<string>>();
    const blocked = new Set<string>();

    for (const file of moving.values()) {
      const from = relative(root, file.now).split(sep);
      const to = relative(root, file.to).split(sep);

      if (from.length <= depth) {
        continue;
      }

      const source = join(root, ...from.slice(0, depth));

      if (to.length <= depth) {
        blocked.add(source);
        continue;
      }

      targets.set(
        source,
        (targets.get(source) ?? new Set()).add(join(root, ...to.slice(0, depth))),
      );
    }

    const renamed: string[] = [];

    for (const [source, goingTo] of targets) {
      const [target] = goingTo;

      if (target === undefined || goingTo.size !== 1 || target === source || blocked.has(source)) {
        continue;
      }

      const held = await db
        .select({ id: mediaItem.id, parentId: mediaItem.parentId, extraKind: mediaItem.extraKind })
        .from(mediaItem)
        .where(
          and(
            eq(mediaItem.libraryId, libraryId),
            like(mediaItem.path, `${likeLiterally(`${source}${sep}`)}%`),
          ),
        );
      const isOnlyMoving = held.every(
        (one) =>
          moving.has(one.id) ||
          (one.extraKind !== null && one.parentId !== null && moving.has(one.parentId)),
      );

      if (!isOnlyMoving || (await isTakenBesides(source, target))) {
        continue;
      }

      const isRenamed = await mkdir(dirname(target), { recursive: true })
        .then(() => rename(source, target))
        .then(
          () => true,
          () => false,
        );

      if (!isRenamed) {
        continue;
      }

      await rebaseFolder(libraryId, source, target);
      await removeEmptyFoldersUpTo(dirname(source), root);

      for (const file of moving.values()) {
        if (file.now.startsWith(`${source}${sep}`)) {
          file.now = `${target}${file.now.slice(source.length)}`;
        }
      }

      renamed.push(target);
    }

    return renamed;
  };

  /**
   * Moves one file to where it goes, with what is kept beside it for it alone, renamed to match.
   *
   * @param from - Where it is.
   * @param to - Where it goes.
   * @returns Whether it moved.
   */
  const moveWithSidecars = async (from: string, to: string): Promise<boolean> => {
    if (await isTakenBesides(from, to)) {
      return false;
    }

    const folder = dirname(from);
    const stem = basename(from, extname(from));
    const newStem = basename(to, extname(to));
    const beside = await readdir(folder).catch((): string[] => []);
    const isMoved = await moveFile(from, to).then(
      () => true,
      () => false,
    );

    if (!isMoved) {
      return false;
    }

    for (const name of beside.filter((one) => isSidecarOf(one, stem))) {
      const sidecar = join(dirname(to), `${newStem}${name.slice(stem.length)}`);

      if ((await stat(sidecar).catch(() => null)) === null) {
        await moveFile(join(folder, name), sidecar).catch(() => undefined);
      }
    }

    return true;
  };

  /**
   * Renames the files asked for, then asks for each library's moved files to be read again.
   *
   * @param mediaIds - The files.
   * @param whenTaken - What to do where something else already has a file's new name: leave the
   *   file as it is, or give it the next free number.
   * @returns How many were renamed and left, and the job reading them again.
   */
  const apply = async (
    mediaIds: readonly string[],
    whenTaken: 'skip' | 'number',
  ): Promise<PatternRenameResult> => {
    const planned = await planFiles(mediaIds);
    const claimed = new Set(
      planned.filter((one) => one.state === 'ready').map((one) => one.to.toLowerCase()),
    );
    const going: PlannedFile[] = [];

    for (const one of planned) {
      if (one.state === 'ready') {
        going.push(one);
      } else if (one.state === 'taken' && whenTaken === 'number') {
        const to = await numberedPathOf(one.to, claimed);

        claimed.add(to.toLowerCase());
        going.push({ ...one, to });
      }
    }

    let renamed = 0;
    let jobId: string | null = null;

    for (const libraryId of new Set(going.map((one) => one.libraryId))) {
      const here = going.filter((one) => one.libraryId === libraryId);
      const root = here[0]?.root ?? '';
      const moving = new Map(here.map((one) => [one.mediaId, { now: one.from, to: one.to }]));
      const folders = [
        ...(await renameFolders(libraryId, root, 1, moving)),
        ...(await renameFolders(libraryId, root, 2, moving)),
      ];
      const arrived: string[] = [];

      for (const [mediaId, file] of moving) {
        if (file.now !== file.to) {
          if (!(await moveWithSidecars(file.now, file.to))) {
            continue;
          }

          await repathFile(libraryId, mediaId, file.now, file.to);
          await removeEmptyFoldersUpTo(dirname(file.now), root);
        }

        renamed += 1;
        arrived.push(file.to);
      }

      const carried =
        folders.length === 0
          ? []
          : await db
              .select({ path: mediaItem.path })
              .from(mediaItem)
              .where(
                and(
                  eq(mediaItem.libraryId, libraryId),
                  isNotNull(mediaItem.extraKind),
                  inArray(mediaItem.parentId, [...moving.keys()]),
                ),
              );
      const paths = [...new Set([...arrived, ...carried.map((one) => one.path)])];

      if (paths.length > 0) {
        jobId = (await queueReadAgain(libraryId, paths, true)) ?? jobId;
      }
    }

    return { renamed, skipped: planned.length - renamed, jobId };
  };

  return {
    plan: async (mediaIds: readonly string[]): Promise<PatternRenamePlan> => ({
      files: (await planFiles(mediaIds)).map((file) => ({
        mediaId: file.mediaId,
        from: file.from,
        to: file.to,
        sidecars: file.sidecars,
        state: file.state,
      })),
    }),
    apply,
  };
};

export { createPatternRenames };
