import type { Announcement } from '@ValenceContracts/schemas/Announcement';

/**
 * Whether an announcement is still meant to be shown: it is, until the moment it was set to end,
 * where it was set to end at all.
 *
 * @param announcement - The announcement.
 * @param nowMs - The time now.
 * @returns Whether it is still up.
 */
const isAnnouncementUp = (announcement: Announcement, nowMs: number): boolean =>
  announcement.endsAt === null || Date.parse(announcement.endsAt) > nowMs;

export { isAnnouncementUp };
