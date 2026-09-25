import type { ScanResult } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Says what a scan changed in the few words a table cell has room for. "Scanned an hour ago" and
 * "scanned an hour ago, removed two hundred items" answer the same question, and only the second
 * tells an operator their mount was missing.
 *
 * @param result What the last scan counted.
 */
const describeScanResult = (result: ScanResult): string => {
  const { added, updated, removed, failed } = result;

  if (added === 0 && updated === 0 && removed === 0 && failed === 0) {
    return say('client.describeScanResult.nothingChanged');
  }

  const counts = [
    `+${added.toString()}`,
    `~${updated.toString()}`,
    `−${removed.toString()}`,
    ...(failed === 0 ? [] : [sayCount('client.describeScanResult.unreadable', failed)]),
  ];

  return counts.join(' ');
};

export { describeScanResult };
