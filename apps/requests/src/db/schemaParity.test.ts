import { getTableName, is } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import {
  MySqlColumnWithAutoIncrement,
  MySqlTable,
  getTableConfig as getMySqlTableConfig,
} from 'drizzle-orm/mysql-core';
import { PgTable, getTableConfig as getPgTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import * as mysql from '@ValenceRequests/db/mysql/Schema';
import * as postgres from '@ValenceRequests/db/postgres/Schema';

const MYSQL_PREFIX = 'requests_';

const MYSQL_DATA_TYPE_OF_JSON = 'custom';

type Shape = {
  name: string;
  columns: {
    name: string;
    dataType: string;
    notNull: boolean;
    hasDefault: boolean;
    primary: boolean;
    numberedByDatabase: boolean;
    enumValues: string[] | undefined;
  }[];
  foreignKeys: {
    columns: string[];
    foreignTable: string;
    foreignColumns: string[];
    onDelete: string | undefined;
  }[];
  uniques: { name: string | undefined; columns: string[] }[];
  indexes: (string | undefined)[];
};

/**
 * Reads a Postgres table as the shape both dialects are held to.
 *
 * @param table - The table.
 * @returns Its shape.
 */
const shapeOfPostgres = (table: PgTable): Shape => {
  const config = getPgTableConfig(table);

  return {
    name: config.name,
    columns: config.columns.map((column) => ({
      name: column.name,
      dataType: column.dataType,
      notNull: column.notNull,
      hasDefault: column.hasDefault && column.generatedIdentity === undefined,
      primary: column.primary,
      numberedByDatabase: column.generatedIdentity !== undefined,
      enumValues: column.enumValues,
    })),
    foreignKeys: config.foreignKeys.map((key) => {
      const reference = key.reference();

      return {
        columns: reference.columns.map((column) => column.name),
        foreignTable: getTableName(reference.foreignTable),
        foreignColumns: reference.foreignColumns.map((column) => column.name),
        onDelete: key.onDelete,
      };
    }),
    uniques: config.uniqueConstraints.map((unique) => ({
      name: unique.getName(),
      columns: unique.columns.map((column) => column.name),
    })),
    indexes: config.indexes.map((index) => index.config.name),
  };
};

/**
 * Reads a MySQL table as the same shape, without the prefix its name carries in place of a schema
 * and with its JSON columns read as the JSON they hold.
 *
 * @param table - The table.
 * @returns Its shape.
 */
const shapeOfMysql = (table: MySqlTable): Shape => {
  const config = getMySqlTableConfig(table);

  return {
    name: config.name.replace(MYSQL_PREFIX, ''),
    columns: config.columns.map((column) => {
      const numberedByDatabase = is(column, MySqlColumnWithAutoIncrement) && column.autoIncrement;

      return {
        name: column.name,
        dataType:
          column.dataType === MYSQL_DATA_TYPE_OF_JSON && column.getSQLType() === 'json'
            ? 'json'
            : column.dataType,
        notNull: column.notNull,
        hasDefault: column.hasDefault && !numberedByDatabase,
        primary: column.primary,
        numberedByDatabase,
        enumValues: column.enumValues,
      };
    }),
    foreignKeys: config.foreignKeys.map((key) => {
      const reference = key.reference();

      return {
        columns: reference.columns.map((column) => column.name),
        foreignTable: getTableName(reference.foreignTable).replace(MYSQL_PREFIX, ''),
        foreignColumns: reference.foreignColumns.map((column) => column.name),
        onDelete: key.onDelete,
      };
    }),
    uniques: config.uniqueConstraints.map((unique) => ({
      name: unique.getName(),
      columns: unique.columns.map((column) => column.name),
    })),
    indexes: config.indexes.map((index) => index.config.name),
  };
};

const POSTGRES_TABLES = Object.entries(postgres).flatMap(([name, table]) =>
  is(table, PgTable) ? [{ name, table }] : [],
);

const MYSQL_TABLES = new Map(
  Object.entries(mysql).flatMap(([name, table]) =>
    is(table, MySqlTable) ? [[name, table] as const] : [],
  ),
);

describe('the two schema modules', () => {
  it('export the same names', () => {
    expect(Object.keys(mysql).toSorted()).toEqual(Object.keys(postgres).toSorted());
  });

  it('describe the same tables', () => {
    expect([...MYSQL_TABLES.keys()].toSorted()).toEqual(
      POSTGRES_TABLES.map(({ name }) => name).toSorted(),
    );
  });

  it('keep every MySQL table under the prefix that stands in for the Postgres schema', () => {
    expect(
      [...MYSQL_TABLES.values()].filter((table) => !getTableName(table).startsWith(MYSQL_PREFIX)),
    ).toEqual([]);
  });

  it.each(POSTGRES_TABLES)(
    'agree on $name: columns, nullability, defaults, keys and indexes',
    ({ name, table }) => {
      const twin = MYSQL_TABLES.get(name);

      expect(twin).toBeDefined();

      if (twin !== undefined) {
        expect(shapeOfMysql(twin)).toEqual(shapeOfPostgres(table));
      }
    },
  );

  it('read every table as the same rows', () => {
    expectTypeOf<InferSelectModel<typeof mysql.setting>>().toEqualTypeOf<
      InferSelectModel<typeof postgres.setting>
    >();
    expectTypeOf<InferSelectModel<typeof mysql.giveUpRules>>().toEqualTypeOf<
      InferSelectModel<typeof postgres.giveUpRules>
    >();
    expectTypeOf<InferSelectModel<typeof mysql.indexer>>().toEqualTypeOf<
      InferSelectModel<typeof postgres.indexer>
    >();
    expectTypeOf<InferSelectModel<typeof mysql.indexerDefinition>>().toEqualTypeOf<
      InferSelectModel<typeof postgres.indexerDefinition>
    >();
    expectTypeOf<InferSelectModel<typeof mysql.downloadClient>>().toEqualTypeOf<
      InferSelectModel<typeof postgres.downloadClient>
    >();
    expectTypeOf<InferSelectModel<typeof mysql.sentDownload>>().toEqualTypeOf<
      InferSelectModel<typeof postgres.sentDownload>
    >();
    expectTypeOf<InferSelectModel<typeof mysql.serviceEvent>>().toEqualTypeOf<
      InferSelectModel<typeof postgres.serviceEvent>
    >();
    expectTypeOf<InferSelectModel<typeof mysql.qualityProfile>>().toEqualTypeOf<
      InferSelectModel<typeof postgres.qualityProfile>
    >();
    expectTypeOf<InferSelectModel<typeof mysql.mediaRequest>>().toEqualTypeOf<
      InferSelectModel<typeof postgres.mediaRequest>
    >();
    expectTypeOf<InferSelectModel<typeof mysql.requestItem>>().toEqualTypeOf<
      InferSelectModel<typeof postgres.requestItem>
    >();
    expectTypeOf<InferSelectModel<typeof mysql.blocklistedRelease>>().toEqualTypeOf<
      InferSelectModel<typeof postgres.blocklistedRelease>
    >();
    expectTypeOf<InferSelectModel<typeof mysql.requestLog>>().toEqualTypeOf<
      InferSelectModel<typeof postgres.requestLog>
    >();
  });
});
