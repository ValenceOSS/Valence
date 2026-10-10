import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from '@tanstack/react-router';
import { placeIn, writeLocation } from '@ValenceClient/navigation/readLocation';
import type { Place } from '@ValenceClient/navigation/readLocation';

const PAGE_SCOPED: Partial<Place> = { search: '', genre: null, filters: null, library: null };

/**
 * Where the application is, read from the router rather than held in state, so that every place in
 * Valence is somewhere the browser can go back to, reload into, or have a link sent to.
 *
 * The router owns the address and the history; this turns what it holds into the shape the shell
 * reasons in, and turns a change to that shape back into an address. It reads the router's history
 * rather than its matches, because the shell draws every address itself and only wants to know
 * which one it is at.
 *
 * Moving to another section leaves behind what belonged to the page being left — what was typed,
 * the genre and filters chosen, the library narrowed to — unless the move says them itself, so a
 * filter chosen on one page does not quietly narrow the next.
 *
 * @returns Where it is, and the two ways of moving: one that leaves a way back, one that does not.
 */
const usePlace = (): {
  place: Place;
  go: (change: Partial<Place>) => void;
  replace: (change: Partial<Place>) => void;
} => {
  const router = useRouter();

  const address = useSyncExternalStore(
    useCallback((onChange: () => void) => router.history.subscribe(onChange), [router]),
    () => router.history.location.href,
  );

  const place = useMemo(() => {
    const [pathname = '/', query = ''] = address.split('?');

    return placeIn(pathname, Object.fromEntries(new URLSearchParams(query)));
  }, [address]);

  const move = useCallback(
    (change: Partial<Place>, isReplacing: boolean) => {
      const isLeaving = change.section !== undefined && change.section !== place.section;
      const next = writeLocation({
        ...place,
        ...(isLeaving ? PAGE_SCOPED : {}),
        ...change,
      });

      if (next === address) {
        return;
      }

      if (isReplacing) {
        router.history.replace(next);
      } else {
        router.history.push(next);
      }
    },
    [place, address, router],
  );

  return {
    place,
    go: useCallback(
      (change: Partial<Place>) => {
        move(change, false);
      },
      [move],
    ),
    replace: useCallback(
      (change: Partial<Place>) => {
        move(change, true);
      },
      [move],
    ),
  };
};

export { usePlace };
