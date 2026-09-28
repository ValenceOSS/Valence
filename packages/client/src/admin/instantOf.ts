import { offsetAt } from '@ValenceClient/admin/offsetAt';

/**
 * The instant at which a wall clock in one zone reads a given date and time.
 *
 * @param wall - The wall-clock reading, as UTC parts.
 * @param zone - The zone the clock is in.
 * @returns The moment that clock shows that reading.
 */
const instantOf = (wall: number, zone: string): Date =>
  new Date(wall - offsetAt(new Date(wall), zone));

export { instantOf };
