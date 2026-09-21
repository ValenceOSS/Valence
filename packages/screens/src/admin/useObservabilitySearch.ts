import { useCallback, useState } from 'react';
import { mergeObservabilitySearch } from '@ValenceClient/admin/mergeObservabilitySearch';
import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';

/**
 * Holds what the jobs and logs page has narrowed itself to, in step with the address that carries it.
 *
 * A change shows at once and is handed to the address; the address handing back something different
 * — the back button, a link — replaces what is held. Held here as well as in the address so that the
 * page works wherever there is no address to carry it, and so that a change does not wait on the
 * address to come back before it is drawn.
 *
 * @param given - What the address says.
 * @param onChange - Told each change, to write into the address.
 * @returns What is held, and the way to change it, where a field given as nothing is taken off.
 */
const useObservabilitySearch = (
  given: ObservabilitySearch,
  onChange?: (change: ObservabilitySearch) => void,
): [ObservabilitySearch, (change: ObservabilitySearch) => void] => {
  const key = JSON.stringify(given);
  const [seen, setSeen] = useState(key);
  const [search, setSearch] = useState(given);

  if (seen !== key) {
    setSeen(key);
    setSearch(given);
  }

  const update = useCallback(
    (change: ObservabilitySearch) => {
      setSearch((was) => mergeObservabilitySearch(was, change));
      onChange?.(change);
    },
    [onChange],
  );

  return [search, update];
};

export { useObservabilitySearch };
