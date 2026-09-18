type PhotographFileSystem = {
  list: (directory: string) => Promise<string[]>;
  ensure: (directory: string) => Promise<void>;
  has: (path: string) => Promise<boolean>;
  move: (from: string, to: string) => Promise<void>;
};

type MovePhotographsOnceOptions = {
  from: string;
  to: string;
  files: PhotographFileSystem;
  onProblem?: (name: string, reason: string) => void;
};

/**
 * Moves profile photographs out of the artwork cache and onto the directory kept beside the
 * configuration.
 *
 * They were written under the image cache, which is the one directory an operator is told holds
 * nothing that cannot be made again. A photograph somebody uploaded is the only copy there is of it,
 * so it does not belong anywhere named cache, and leaving it there meant a deployment that mapped
 * the artefact directory somewhere of its own — and therefore did not map this one — lost every face
 * on the next update, silently.
 *
 * Runs on every boot and does nothing on all but the first: with the old directory gone, or the two
 * being the same place, there is nothing to walk. A name already present at the destination is left
 * alone rather than overwritten, so a half-finished move finishes rather than undoing itself.
 *
 * @param options - Where they were, where they go, and how to touch the disk.
 * @returns How many were moved.
 */
const movePhotographsOnce = async ({
  from,
  to,
  files,
  onProblem,
}: MovePhotographsOnceOptions): Promise<number> => {
  if (from === to) {
    return 0;
  }

  const names = await files.list(from);

  if (names.length === 0) {
    return 0;
  }

  await files.ensure(to);

  let moved = 0;

  for (const name of names) {
    if (await files.has(`${to}/${name}`)) {
      continue;
    }

    try {
      await files.move(`${from}/${name}`, `${to}/${name}`);

      moved += 1;
    } catch (error) {
      onProblem?.(name, error instanceof Error ? error.message : 'It could not be moved.');
    }
  }

  return moved;
};

export type { PhotographFileSystem };

export { movePhotographsOnce };
