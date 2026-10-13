/**
 * A clock time as the viewer reads it, such as `19:30`, in their own locale.
 *
 * @param at - The moment, as an ISO string.
 * @returns The time.
 */
const liveClockTime = (at: string): string =>
  new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export { liveClockTime };
