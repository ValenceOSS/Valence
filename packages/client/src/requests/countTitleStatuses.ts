import { TITLE_STATUSES } from '@ValenceContracts/schemas/AdminCatalogue';
import type { CatalogueEntry, TitleStatus } from '@ValenceContracts/schemas/AdminCatalogue';

/**
 * How many titles stand at each status, every status counted even where none do.
 *
 * @param entries - The titles.
 * @returns The count for each status.
 */
const countTitleStatuses = (
  entries: readonly CatalogueEntry[],
): Readonly<Record<TitleStatus, number>> => {
  const counts = Object.fromEntries(TITLE_STATUSES.map((status) => [status, 0]));

  for (const entry of entries) {
    counts[entry.status] = (counts[entry.status] ?? 0) + 1;
  }

  return {
    library: counts.library ?? 0,
    downloading: counts.downloading ?? 0,
    missing: counts.missing ?? 0,
    toApprove: counts.toApprove ?? 0,
    failed: counts.failed ?? 0,
    notFollowed: counts.notFollowed ?? 0,
  };
};

export { countTitleStatuses };
