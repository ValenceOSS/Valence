import { baseOfSubject } from './baseOfSubject';
import type { TitleSubjectKind } from '@ValenceContracts/schemas/TitleEdit';
import type { OrphanedEdits } from '@ValenceContracts/schemas/OrphanedEdits';

type Subject = { key: string; kind: string; fields: number; setAt: Date; name: string | null };

type LiveTitle = { key: string; id: string; name: string; leadId: string; kind: 'film' | 'show' };

type OrphanOptions = {
  subjects: (libraryId: string) => Promise<Subject[]>;
  titles: (libraryId: string) => Promise<LiveTitle[]>;
  move: (
    libraryId: string,
    moves: readonly { from: string; to: string; kind: TitleSubjectKind }[],
  ) => Promise<number>;
  forget: (libraryId: string, keys: readonly string[]) => Promise<number>;
};

const KINDS: readonly TitleSubjectKind[] = ['film', 'show', 'season', 'episode'];

/**
 * Finds the edits an administrator made to titles whose files have since gone, so they are not lost
 * without trace: lists them a title at a time, attaches one to a title still there, keeping each
 * season's and episode's part under the new title, or throws it away.
 *
 * @param options - How to read what edits are kept and which titles a library holds, and how to move
 *   and throw away edits.
 * @returns The finder.
 */
const createOrphanedEdits = ({ subjects, titles, move, forget }: OrphanOptions) => {
  /**
   * Lists the titles of a library that edits are kept for but that no longer have a file.
   *
   * @param libraryId - The library.
   * @returns Each title's key, kind, how many fields and when last edited, and its edited name.
   */
  const list = async (libraryId: string): Promise<OrphanedEdits> => {
    const [kept, live] = await Promise.all([subjects(libraryId), titles(libraryId)]);
    const there = new Set(live.map((one) => one.key));
    const orphans = new Map<string, OrphanedEdits['orphans'][number]>();

    for (const one of kept) {
      const base = baseOfSubject(one.key, one.kind);

      if (there.has(base)) {
        continue;
      }

      const held = orphans.get(base);
      const isTop = base === one.key;

      orphans.set(base, {
        key: base,
        kind: held?.kind ?? (one.kind === 'film' ? 'film' : 'show'),
        fields: (held?.fields ?? 0) + one.fields,
        setAt: [held?.setAt ?? '', one.setAt.toISOString()].sort().at(-1) ?? '',
        name: isTop ? (one.name ?? held?.name ?? null) : (held?.name ?? null),
      });
    }

    return {
      orphans: [...orphans.values()].sort((left, right) => right.setAt.localeCompare(left.setAt)),
    };
  };

  /**
   * Moves the edits of a title that has gone onto one still there, a programme's seasons and
   * episodes with it.
   *
   * @param libraryId - The library.
   * @param key - The gone title's key.
   * @param toId - The title still there, by its row id in the list.
   * @returns How many edits moved, or nothing where either title is not found.
   */
  const attach = async (libraryId: string, key: string, toId: string): Promise<number | null> => {
    const [kept, live] = await Promise.all([subjects(libraryId), titles(libraryId)]);
    const to = live.find((one) => one.id === toId);

    if (to === undefined) {
      return null;
    }

    const moves = kept.flatMap((one) => {
      const kind = KINDS.find((candidate) => candidate === one.kind);

      return kind === undefined || baseOfSubject(one.key, one.kind) !== key
        ? []
        : [{ from: one.key, to: `${to.key}${one.key.slice(key.length)}`, kind }];
    });

    return moves.length === 0 ? null : move(libraryId, moves);
  };

  /**
   * Throws away every edit kept for a title that has gone, its seasons' and episodes' with it.
   *
   * @param libraryId - The library.
   * @param key - The gone title's key.
   * @returns How many edits went.
   */
  const throwAway = async (libraryId: string, key: string): Promise<number> => {
    const kept = await subjects(libraryId);

    return forget(
      libraryId,
      kept.filter((one) => baseOfSubject(one.key, one.kind) === key).map((one) => one.key),
    );
  };

  return { list, attach, throwAway };
};

type OrphanedEditsService = ReturnType<typeof createOrphanedEdits>;

export type { OrphanedEditsService };

export { createOrphanedEdits };
