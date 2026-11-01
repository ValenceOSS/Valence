import type { PresenceSession } from '@ValenceServer/presence/PresenceService';

/**
 * What to call a connection in a list of places to play something, or in a note saying where a
 * command came from: a browser by the browser it is, since two browsers on one Mac are both a Mac and
 * telling them apart is the point of the list, unless its owner named the device; anything else by
 * the device.
 *
 * @param entry - The connection.
 * @returns Its name in the list.
 */
const pickerLabelOf = (
  entry: Pick<PresenceSession, 'deviceLabel' | 'clientLabel' | 'clientKind' | 'renamed'>,
): string =>
  entry.clientKind === 'browser' && entry.renamed === null && entry.clientLabel !== null
    ? entry.clientLabel
    : entry.deviceLabel;

export { pickerLabelOf };
