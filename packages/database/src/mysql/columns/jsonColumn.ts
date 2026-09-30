import { customType } from 'drizzle-orm/mysql-core';
import type { json } from 'drizzle-orm/mysql-core';
import { z } from 'zod';

type JsonData = ReturnType<typeof json>['_']['data'];

const DOCUMENT = customType<{ data: JsonData; driverData: string }>({
  dataType: () => 'json',
  toDriver: (value) => JSON.stringify(value),
  fromDriver: (value) => z.json().parse(JSON.parse(value)),
});

/**
 * A JSON column that reads the same on MySQL and MariaDB. MariaDB keeps JSON as text and hands it
 * back as a string, so the pool asks both for strings and every value is parsed here.
 *
 * @param name - The column's name.
 * @returns The column builder.
 */
const jsonColumn = <N extends string>(name: N) => DOCUMENT(name);

export { jsonColumn };
