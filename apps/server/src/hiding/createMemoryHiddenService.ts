import { randomUUID } from 'node:crypto';
import type { Hidden } from '@ValenceContracts/schemas/Hidden';
import type { HiddenService, HiddenSubject } from '@ValenceServer/hiding/HiddenService';

type MemoryRow = {
  id: string;
  profileId: string;
  kind: Hidden['kind'];
  subjectId: string;
  hiddenAt: Date;
};

type MemoryState = {
  rows: MemoryRow[];
  titles?: Record<string, string>;
};

/**
 * What people have hidden, held in memory, so the routes can be exercised without Postgres.
 *
 * Refuses a subject it has no title for, as the database version refuses one that is not there, so
 * a test cannot hide something that does not exist and conclude the server allows it.
 *
 * @param state - Anything already hidden, and the titles of the things that can be.
 * @returns The service, and the state behind it.
 */
const createMemoryHiddenService = (
  state: MemoryState = { rows: [] },
): HiddenService & { state: MemoryState } => {
  const matches = (row: MemoryRow, profileId: string, subject: HiddenSubject): boolean =>
    row.profileId === profileId && row.kind === subject.kind && row.subjectId === subject.subjectId;

  return {
    state,

    list: (profileId) =>
      Promise.resolve(
        state.rows
          .filter((row) => row.profileId === profileId)
          .sort((one, other) => other.hiddenAt.getTime() - one.hiddenAt.getTime())
          .map((row) => ({
            kind: row.kind,
            subjectId: row.subjectId,
            title: state.titles?.[row.subjectId] ?? row.subjectId,
            hiddenAt: row.hiddenAt.toISOString(),
          })),
      ),

    hide: (profileId, subject) => {
      if (state.titles?.[subject.subjectId] === undefined) {
        return Promise.resolve(false);
      }

      if (!state.rows.some((row) => matches(row, profileId, subject))) {
        state.rows.push({
          id: randomUUID(),
          profileId,
          kind: subject.kind,
          subjectId: subject.subjectId,
          hiddenAt: new Date(),
        });
      }

      return Promise.resolve(true);
    },

    show: (profileId, subject) => {
      const before = state.rows.length;

      state.rows = state.rows.filter((row) => !matches(row, profileId, subject));

      return Promise.resolve(state.rows.length < before);
    },
  };
};

export type { MemoryState };

export { createMemoryHiddenService };
