import { readFromServer } from '@ValenceClient/query/readFromServer';
import { BackupListSchema, BackupSchema } from '@ValenceContracts/schemas/Backup';
import type { Backup, BackupList } from '@ValenceContracts/schemas/Backup';
import { sendToServer } from './sendToServer';

/**
 * Reads the copies of the database in the server's backup folder, newest first.
 *
 * @returns The copies, and how one is put back.
 */
const fetchBackups = (): Promise<BackupList> =>
  readFromServer('/api/admin/backups', BackupListSchema);

/**
 * Copies the whole database into the backup folder now.
 *
 * @returns The copy, or why none could be taken.
 */
const takeBackup = () =>
  sendToServer<Backup>('/api/admin/backups', { method: 'POST' }, BackupSchema);

/**
 * Deletes one copy from the backup folder.
 *
 * @param name - The copy.
 * @returns Whether it was deleted.
 */
const removeBackup = async (name: string): Promise<boolean> => {
  const response = await fetch(`/api/admin/backups/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * Where one copy is downloaded from.
 *
 * @param name - The copy.
 * @returns Its address on this server.
 */
const backupAddress = (name: string): string => `/api/admin/backups/${encodeURIComponent(name)}`;

export { backupAddress, fetchBackups, removeBackup, takeBackup };
