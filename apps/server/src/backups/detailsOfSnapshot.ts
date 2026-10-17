import type { BackupKind } from '@ValenceContracts/schemas/Backup';
import { SNAPSHOT_SUFFIX } from '#dialect/SNAPSHOT_SUFFIX';

type SnapshotDetails = {
  kind: BackupKind;
  takenAt: Date;
  before: string | null;
};

const PARTS = /^valence-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z-(.+)$/;

/**
 * Reads back from a snapshot's name when it was taken and why: ahead of which upgrade, by hand, or
 * on the schedule.
 *
 * @param name - The file name.
 * @returns What its name says, or null where it is not one of these snapshots.
 */
const detailsOfSnapshot = (name: string): SnapshotDetails | null => {
  if (!name.endsWith(SNAPSHOT_SUFFIX)) {
    return null;
  }

  const parts = PARTS.exec(name.slice(0, -SNAPSHOT_SUFFIX.length));

  if (parts === null) {
    return null;
  }

  const [, day, hours, minutes, seconds, milliseconds, reason = ''] = parts;
  const takenAt = new Date(
    Date.UTC(
      Number(day?.slice(0, 4)),
      Number(day?.slice(5, 7)) - 1,
      Number(day?.slice(8, 10)),
      Number(hours),
      Number(minutes),
      Number(seconds),
      Number(milliseconds),
    ),
  );

  if (Number.isNaN(takenAt.getTime())) {
    return null;
  }

  if (reason === 'by-hand') {
    return { kind: 'byHand', takenAt, before: null };
  }

  if (reason === 'on-schedule') {
    return { kind: 'onSchedule', takenAt, before: null };
  }

  return reason.startsWith('before-') && reason.length > 'before-'.length
    ? { kind: 'beforeUpgrade', takenAt, before: reason.slice('before-'.length) }
    : null;
};

export type { SnapshotDetails };

export { detailsOfSnapshot };
