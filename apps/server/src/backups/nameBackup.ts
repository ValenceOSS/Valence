import { SNAPSHOT_SUFFIX } from '#dialect/SNAPSHOT_SUFFIX';

/**
 * Names a backup taken outside an upgrade, in the same shape as the snapshots taken before one, so
 * that every copy in the folder sorts by age together.
 *
 * @param at - When it was taken.
 * @param kind - Whether somebody asked for it or the schedule did.
 * @returns The file name.
 */
const nameBackup = (at: Date, kind: 'byHand' | 'onSchedule'): string =>
  `valence-${at.toISOString().replace(/[:.]/g, '-')}-${kind === 'byHand' ? 'by-hand' : 'on-schedule'}${SNAPSHOT_SUFFIX}`;

export { nameBackup };
