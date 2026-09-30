import { sql } from 'drizzle-orm';
import { moment } from './moment';

/**
 * A moment column the database fills with the time the row was written, where nothing is given.
 *
 * @param name - The column's name.
 * @returns The column builder.
 */
const momentNow = <N extends string>(name: N) => moment(name).default(sql`(current_timestamp(3))`);

export { momentNow };
