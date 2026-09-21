import { useObservabilitySearch } from '@ValenceScreens/admin/useObservabilitySearch';
import type { ReactNode } from 'react';
import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';

type ObservabilitySearchHostProps = {
  initial?: ObservabilitySearch;
  onChange?: (change: ObservabilitySearch) => void;
  children: (
    search: ObservabilitySearch,
    update: (change: ObservabilitySearch) => void,
  ) => ReactNode;
};

/**
 * Stands in for the address that carries what the jobs and logs page is narrowed to, so a view can be
 * drawn on its own and still have its choices take effect.
 *
 * @param initial - What the address says to begin with.
 * @param onChange - Told each change, as the address would be.
 * @param children - Draws the view, given what is held and the way to change it.
 */
const ObservabilitySearchHost = ({
  initial = {},
  onChange,
  children,
}: ObservabilitySearchHostProps) => {
  const [search, update] = useObservabilitySearch(initial, onChange);

  return <>{children(search, update)}</>;
};

ObservabilitySearchHost.displayName = 'ObservabilitySearchHost';

export { ObservabilitySearchHost };
