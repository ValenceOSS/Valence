import { OBSERVABILITY_VIEWS } from '@ValenceClient/admin/ObservabilitySearchSchema';
import type { ObservabilityView } from '@ValenceClient/admin/ObservabilitySearchSchema';

/**
 * Reads which view of the jobs and logs page an address asked to open on.
 *
 * The page is served at `/admin/jobs`, and `/admin/logs` opens its log, so a link or a bookmark to
 * either lands where it meant to.
 *
 * @param view - What the address's `view` said, if it said anything.
 * @param panel - Which panel the address named.
 * @returns The view to open on, or nothing where the page's own default should be used.
 */
const readObservabilityView = (
  view: string | undefined,
  panel: string | undefined,
): ObservabilityView | undefined =>
  OBSERVABILITY_VIEWS.find((one) => one === view) ?? (panel === 'logs' ? 'logs' : undefined);

export { readObservabilityView };
