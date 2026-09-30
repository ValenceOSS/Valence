import { datetime } from 'drizzle-orm/mysql-core';

/**
 * A column holding a moment to the millisecond, read and written in UTC. `datetime` rather than
 * `timestamp`, which ends in 2038 and shifts with the session's time zone.
 *
 * @param name - The column's name.
 * @returns The column builder.
 */
const moment = <N extends string>(name: N) => datetime(name, { mode: 'date', fsp: 3 });

export { moment };
