import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { setHidden } from '@ValenceClient/library/fetchHidden';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import type { Hidden } from '@ValenceContracts/schemas/Hidden';
import type { HiddenSubject } from '@ValenceClient/library/fetchHidden';

type Hiding = {
  entries: Hidden[];
  isHidden: (subject: HiddenSubject) => boolean;
  hide: (subject: HiddenSubject, title: string) => void;
  show: (subject: HiddenSubject) => void;
};

const keyOf = (subject: HiddenSubject): string => `${subject.kind}:${subject.subjectId}`;

/**
 * What this viewer has hidden, and the two gestures that change it.
 *
 * The change is written to the cache before the server is asked, so something disappears the moment
 * it is hidden and comes back the same way if the server refuses. Only that one entry is put back
 * rather than the whole list, since hiding two things quickly should not have the first undone by
 * the second being refused.
 *
 * Once the server agrees, the library is read again. Hiding is the one preference here that changes
 * what the *server* answers rather than only what this screen draws — the rails, the search results
 * and the randomiser are all lists the server filtered — so a stale copy would leave the thing on
 * screen until something else happened to refetch.
 *
 * @param watcherId - Who is watching, so that their list is the one asked for.
 * @returns What they have hidden, and how to change it.
 */
const useHidden = (watcherId: string | null): Hiding => {
  const cache = useQueryClient();
  const asked = viewingQueries.hidden(watcherId);
  const held = useQuery(asked);

  const entries = useMemo(() => held.data ?? [], [held.data]);
  const keys = useMemo(() => new Set(entries.map(keyOf)), [entries]);

  const write = (change: (held: readonly Hidden[]) => Hidden[]): void => {
    cache.setQueryData(asked.queryKey, (held: Hidden[] = []) => change(held));
  };

  const without = (subject: HiddenSubject) => (held: readonly Hidden[]) =>
    held.filter((entry) => keyOf(entry) !== keyOf(subject));

  const ask = (
    subject: HiddenSubject,
    wants: boolean,
    change: (held: readonly Hidden[]) => Hidden[],
    undo: (held: readonly Hidden[]) => Hidden[],
  ): void => {
    write(change);
    void cache.cancelQueries({ queryKey: asked.queryKey }, { revert: false });

    void setHidden(subject, wants).then((agreed) => {
      if (agreed) {
        void cache.invalidateQueries({ queryKey: libraryQueries.key });

        return;
      }

      write(undo);
    });
  };

  return {
    entries,
    isHidden: (subject) => keys.has(keyOf(subject)),
    hide: (subject, title) => {
      const entry: Hidden = { ...subject, title, hiddenAt: new Date().toISOString() };

      ask(subject, true, (held) => [entry, ...without(subject)(held)], without(subject));
    },
    show: (subject) => {
      const going = entries.find((entry) => keyOf(entry) === keyOf(subject));

      ask(subject, false, without(subject), (held) =>
        going === undefined ? [...held] : [going, ...without(subject)(held)],
      );
    },
  };
};

export type { Hiding };

export { useHidden };
