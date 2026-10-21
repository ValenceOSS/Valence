import { useEffect, useRef, useState } from 'react';
import { hashKey, useQueryClient } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';

/**
 * Asks the server again for some answers each time the part of the page showing them comes into
 * view, even where what is held is recent enough not to, joining a question already being asked
 * rather than starting a second. An answer that joins the part while it is in view, as a library's
 * files do once the libraries are known, is asked again too.
 *
 * Call it after the queries it asks again, so they are being shown by the time it asks.
 *
 * @param isShown - Whether the part is in view.
 * @param queryKeys - The answers it shows.
 * @returns Whether it is still waiting for any answer it asked again.
 */
const useLookAgainWhenShown = (isShown: boolean, queryKeys: readonly QueryKey[]): boolean => {
  const answers = useQueryClient();
  const keys = useRef(queryKeys);
  const asked = useRef(new Set<string>());
  const [waiting, setWaiting] = useState(0);
  const shown = queryKeys.map((queryKey) => hashKey(queryKey)).join('\n');

  useEffect(() => {
    keys.current = queryKeys;
  }, [queryKeys]);

  useEffect(() => {
    if (!isShown) {
      asked.current = new Set();

      return;
    }

    const unasked = keys.current.filter((queryKey) => !asked.current.has(hashKey(queryKey)));

    if (unasked.length === 0) {
      return;
    }

    for (const queryKey of unasked) {
      asked.current.add(hashKey(queryKey));
    }

    setWaiting((count) => count + 1);

    void Promise.all(
      unasked.map((queryKey) =>
        answers.refetchQueries({ queryKey, type: 'active' }, { cancelRefetch: false }),
      ),
    ).finally(() => {
      setWaiting((count) => count - 1);
    });
  }, [answers, isShown, shown]);

  return waiting > 0;
};

export { useLookAgainWhenShown };
