import type { ScanResult } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Says what a scan changed in the few words a table cell has room for. "Scanned an hour ago" and
 * "scanned an hour ago, removed two hundred items" answer the same question, and only the second
 * tells an operator their mount was missing. Files set aside as missing, and found again, are
 * counted after the rest.
 *
 * @param result What the last scan counted.
 */
const describeScanResult = (result: ScanResult): string => {
  const { added, updated, removed, failed, missing = 0, returned = 0 } = result;

  if (
    added === 0 &&
    updated === 0 &&
    removed === 0 &&
    failed === 0 &&
    missing === 0 &&
    returned === 0
  ) {
    return say('client.admin.describeScanResult.nothingChanged');
  }

  const counts = [
    `+${added.toString()}`,
    `~${updated.toString()}`,
    `−${removed.toString()}`,
    ...(missing === 0 ? [] : [sayCount('common.count.missingFiles', missing)]),
    ...(returned === 0 ? [] : [sayCount('common.count.returnedFiles', returned)]),
    ...(failed === 0 ? [] : [sayCount('common.count.unreadable', failed)]),
  ];

  return counts.join(' ');
};

export { describeScanResult };
