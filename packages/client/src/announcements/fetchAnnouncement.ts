import { readFromServer } from '@ValenceClient/query/readFromServer';
import { AnnouncementAnswerSchema } from '@ValenceContracts/schemas/Announcement';
import type { Announcement } from '@ValenceContracts/schemas/Announcement';

/**
 * Reads the announcement an administrator has up for everybody, or nothing where there is none or
 * the one there was has ended.
 *
 * @returns The announcement, or null.
 */
const fetchAnnouncement = async (): Promise<Announcement | null> =>
  (await readFromServer('/api/announcement', AnnouncementAnswerSchema)).announcement;

export { fetchAnnouncement };
