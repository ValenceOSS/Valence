import { sql } from 'drizzle-orm';
import { binary } from 'drizzle-orm/mysql-core';

/**
 * A column the database keeps as the SHA-256 of another, stored, so a unique key can hold text too
 * long for MySQL to index whole — a path, most often.
 *
 * @param name - The column's name.
 * @param source - The name of the column it hashes.
 * @returns The column builder.
 */
const hashOf = <N extends string>(name: N, source: string) =>
  binary(name, { length: 32 }).generatedAlwaysAs(sql`unhex(sha2(${sql.identifier(source)}, 256))`, {
    mode: 'stored',
  });

export { hashOf };
