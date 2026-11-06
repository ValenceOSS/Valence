import type { ExtraKind } from '@ValenceContracts/schemas/Library';
import type { Placement } from './placement/Placement.types';

type ExtraChoice = { path: string; extraKind: ExtraKind | null; parentPath: string | null };

/**
 * Lays what an administrator said of a library's extras over where its file names put them: a file
 * made an extra of a title, of the kind chosen, and a file the names took for an extra that is not
 * one.
 *
 * @param placed - Where the file names put each file.
 * @param choices - What was said of each file chosen.
 * @returns Where each file stands now.
 */
const withExtraChoices = (
  placed: ReadonlyMap<string, Placement>,
  choices: readonly ExtraChoice[],
): Map<string, Placement> => {
  const next = new Map(placed);

  for (const choice of choices) {
    const held = next.get(choice.path);

    if (held === undefined) {
      continue;
    }

    next.set(choice.path, {
      ...held,
      extra:
        choice.extraKind === null
          ? null
          : {
              kind: choice.extraKind,
              parentPath: choice.parentPath,
              seriesFolder: held.extra?.seriesFolder ?? held.episode.seriesFolder,
            },
    });
  }

  return next;
};

export type { ExtraChoice };

export { withExtraChoices };
