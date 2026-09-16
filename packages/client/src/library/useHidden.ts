import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { setHidden } from '@ValenceClient/library/fetchHidden';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import type { Hidden } from '@ValenceContracts/schemas/Hidden';
import type { HiddenSubject } from '@ValenceClient/library/fetchHidden';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { hidingSubjectOf } from '@ValenceClient/library/hidingSubjectOf';
import type { Hiding as Asked } from '@ValenceClient/library/hidingSubjectOf';

type Hiding = {
  entries: Hidden[];
  isHidden: (subject: HiddenSubject) => boolean;
  asking: Asked | null;
  ask: (media: MediaSummary) => void;
  dismiss: () => void;
  confirm: () => void;
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
 * Hiding is asked about before it happens. It takes something out of every row, every search and
 * the randomiser at once, and somebody who meant to press the control beside it has no idea what
 * became of the thing — so the question names what will actually disappear, which for anything
 * belonging to a programme is the programme rather than the episode standing for it.
 *
 * Bringing something back is not asked about. It is the undoing, and asking twice about an undoing
 * is how a list nobody wants to use gets made.
 *
 * What is being asked about is held twice over, and deliberately: as state because the question is
 * drawn from it, and in a ref because agreeing is read back and may happen before a redraw. Held
 * only in state, asking and agreeing in one go would do nothing at all, silently — which is the
 * kind of thing that works everywhere a person is involved and fails the first time something
 * else calls it.
 *
 * @param watcherId - Who is watching, so that their list is the one asked for.
 * @returns What they have hidden, what is being asked about, and how to change either.
 */
const useHidden = (watcherId: string | null): Hiding => {
  const cache = useQueryClient();
  const [asking, setAsking] = useState<Asked | null>(null);

  const pending = useRef<Asked | null>(null);
  const asked = viewingQueries.hidden(watcherId);
  const held = useQuery(asked);

  const entries = useMemo(() => held.data ?? [], [held.data]);
  const keys = useMemo(() => new Set(entries.map(keyOf)), [entries]);

  const write = (change: (held: readonly Hidden[]) => Hidden[]): void => {
    cache.setQueryData(asked.queryKey, (held: Hidden[] = []) => change(held));
  };

  const without = (subject: HiddenSubject) => (held: readonly Hidden[]) =>
    held.filter((entry) => keyOf(entry) !== keyOf(subject));

  const tell = (
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
    asking,
    ask: (media) => {
      const asked = hidingSubjectOf(media);

      pending.current = asked;
      setAsking(asked);
    },
    dismiss: () => {
      pending.current = null;
      setAsking(null);
    },
    confirm: () => {
      const asked = pending.current ?? asking;

      if (asked === null) {
        return;
      }

      const subject: HiddenSubject = { kind: asked.kind, subjectId: asked.subjectId };
      const entry: Hidden = { ...subject, title: asked.title, hiddenAt: new Date().toISOString() };

      pending.current = null;
      setAsking(null);
      tell(subject, true, (held) => [entry, ...without(subject)(held)], without(subject));
    },
    show: (subject) => {
      const going = entries.find((entry) => keyOf(entry) === keyOf(subject));

      tell(subject, false, without(subject), (held) =>
        going === undefined ? [...held] : [going, ...without(subject)(held)],
      );
    },
  };
};

export type { Hiding };

export { useHidden };
