import type { Notification } from '@ValenceContracts/schemas/Notification';

type NotificationDay = 'today' | 'yesterday' | 'earlier';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Sorts notifications, newest first already, under the day they arrived: today, yesterday, or
 * earlier, by the viewer's own calendar rather than by twenty-four hour spans. A day nothing arrived
 * on is left out.
 *
 * @param notifications - The notifications, newest first.
 * @param now - The moment it is, in milliseconds.
 * @returns Each day that has any, with its notifications in the order given.
 */
const groupByDay = (
  notifications: readonly Notification[],
  now: number,
): { day: NotificationDay; notifications: Notification[] }[] => {
  const midnight = new Date(now);

  midnight.setHours(0, 0, 0, 0);

  const startOfToday = midnight.getTime();
  const dayOf = (createdAt: string): NotificationDay => {
    const at = new Date(createdAt).getTime();

    return at >= startOfToday ? 'today' : at >= startOfToday - DAY_MS ? 'yesterday' : 'earlier';
  };

  const days: NotificationDay[] = ['today', 'yesterday', 'earlier'];

  return days
    .map((day) => ({
      day,
      notifications: notifications.filter((one) => dayOf(one.createdAt) === day),
    }))
    .filter((group) => group.notifications.length > 0);
};

export type { NotificationDay };

export { groupByDay };
