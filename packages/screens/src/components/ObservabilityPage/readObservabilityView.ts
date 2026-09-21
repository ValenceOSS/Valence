import type { ObservabilityView } from './ObservabilityPage.types';

const VIEWS: readonly ObservabilityView[] = ['logs', 'jobs', 'health', 'run'];

/**
 * Reads which view of the logs and jobs page an address asked to open on.
 *
 * The page is served at `/admin/logs` now, and what used to be `/admin/jobs` opens its job runs, so
 * a link or a bookmark made before the two were joined still lands where it meant to.
 *
 * @param view - What the address's `view` said, if it said anything.
 * @param panel - Which panel the address named.
 * @returns The view to open on, or nothing where the page's own default should be used.
 */
const readObservabilityView = (
  view: string | undefined,
  panel: string | undefined,
): ObservabilityView | undefined =>
  VIEWS.find((one) => one === view) ?? (panel === 'jobs' ? 'jobs' : undefined);

export { readObservabilityView };
