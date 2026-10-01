import { CronExpressionParser } from 'cron-parser';

/**
 * Works out when a schedule next fires after a moment, reading its cron in the zone it was set in so
 * that "daily at three" means three where the operator is rather than three in UTC.
 *
 * @param cron - The schedule, as a five-field cron expression.
 * @param timezone - The IANA zone it is read in.
 * @param after - The moment to look forward from; a firing exactly then does not count.
 * @returns The next moment it fires.
 */
const nextFiringOf = (cron: string, timezone: string, after: Date): Date =>
  CronExpressionParser.parse(cron, { currentDate: after, tz: timezone }).next().toDate();

export { nextFiringOf };
