import { KEPT_FOR_DAYS } from './KEPT_FOR_DAYS';

const A_DAY = 86_400_000;

/**
 * The oldest a notification may be and still be kept. Notifications stay until somebody opens or
 * clears them, and this is only the floor beneath that, for an inbox nobody ever empties.
 *
 * @param now - The time to count back from.
 * @returns The earliest time a kept notification was written.
 */
const keptSince = (now: Date): Date => new Date(now.getTime() - KEPT_FOR_DAYS * A_DAY);

export { keptSince };
