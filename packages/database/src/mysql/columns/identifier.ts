import { varchar } from 'drizzle-orm/mysql-core';

/**
 * A column holding an id or a reference to one, long enough for a UUID, a better-auth id or a
 * plugin's id, and short enough to sit in any key beside others.
 *
 * @param name - The column's name.
 * @returns The column builder.
 */
const identifier = <N extends string>(name: N) => varchar(name, { length: 64 });

export { identifier };
