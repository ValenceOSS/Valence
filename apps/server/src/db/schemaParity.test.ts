import { is } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel, Table } from 'drizzle-orm';
import { getTableConfig as getMysqlTableConfig, MySqlTable } from 'drizzle-orm/mysql-core';
import { getTableConfig as getPostgresTableConfig, PgTable } from 'drizzle-orm/pg-core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import * as MysqlSchema from '@ValenceServer/db/mysql/Schema';
import * as PostgresSchema from '@ValenceServer/db/postgres/Schema';

type Shape = {
  name: string;
  columns: { name: string; notNull: boolean; hasDefault: boolean; primary: boolean }[];
  primaryKeys: string[][];
  foreignKeys: {
    name: string;
    columns: string[];
    foreignTable: string;
    foreignColumns: string[];
  }[];
  indexes: { name: string; unique: boolean; columns: string[] }[];
  uniques: { name: string; columns: string[] }[];
  checks: string[];
};

type RowsOf<S> = {
  [K in keyof S as S[K] extends Table ? K : never]: S[K] extends Table
    ? InferSelectModel<S[K]>
    : never;
};

type InsertsOf<S> = {
  [K in keyof S as S[K] extends Table ? K : never]: S[K] extends Table
    ? InferInsertModel<S[K]>
    : never;
};

type WithoutOwnColumns<M, P> = {
  [K in keyof M]: K extends keyof P ? Omit<M[K], Exclude<keyof M[K], keyof P[K]>> : M[K];
};

const HASHES = /Hash$/;

const POSTGRES_ONLY_CHECKS = /_one_subject$/;

const POSTGRES_ONLY_INDEXES = new Set(['media_item_genres_idx', 'media_item_cast_idx']);

const MYSQL_NAME_LIMIT = 64;

/**
 * Names the column a MySQL hash column stands in for, so a key on `pathHash` reads as the key on
 * `path` Postgres holds.
 *
 * @param name - The column's name.
 * @param hashes - The names of the table's hash columns.
 * @returns The name it stands in for.
 */
const standingFor = (name: string, hashes: ReadonlySet<string>): string =>
  hashes.has(name) ? name.replace(HASHES, '') : name;

/**
 * Reads the parts of a Postgres table two dialects must agree on.
 *
 * @param table - The table.
 * @returns Its shape.
 */
const postgresShape = (table: PgTable): Shape => {
  const config = getPostgresTableConfig(table);

  return {
    name: config.name,
    columns: config.columns.map((column) => ({
      name: column.name,
      notNull: column.notNull,
      hasDefault: column.hasDefault,
      primary: column.primary,
    })),
    primaryKeys: config.primaryKeys.map((key) => key.columns.map((column) => column.name)),
    foreignKeys: config.foreignKeys.map((key) => {
      const reference = key.reference();

      return {
        name: key.getName(),
        columns: reference.columns.map((column) => column.name),
        foreignTable: getPostgresTableConfig(reference.foreignTable).name,
        foreignColumns: reference.foreignColumns.map((column) => column.name),
      };
    }),
    indexes: config.indexes
      .filter((index) => !POSTGRES_ONLY_INDEXES.has(index.config.name ?? ''))
      .map((index) => ({
        name: index.config.name ?? '',
        unique: index.config.unique,
        columns: index.config.columns.flatMap((column) =>
          'name' in column && column.name !== undefined ? [column.name] : [],
        ),
      })),
    uniques: config.columns.flatMap((column) =>
      column.isUnique ? [{ name: column.uniqueName ?? '', columns: [column.name] }] : [],
    ),
    checks: config.checks
      .map((check) => check.name)
      .filter((name) => !POSTGRES_ONLY_CHECKS.test(name)),
  };
};

/**
 * Reads the parts of a MySQL table two dialects must agree on, with each hash column read as the
 * column it hashes.
 *
 * @param table - The table.
 * @returns Its shape.
 */
const mysqlShape = (table: MySqlTable): Shape => {
  const config = getMysqlTableConfig(table);
  const hashes = new Set(
    config.columns
      .filter((column) => HASHES.test(column.name) && column.generated !== undefined)
      .map((column) => column.name),
  );

  return {
    name: config.name,
    columns: config.columns
      .filter((column) => !hashes.has(column.name))
      .map((column) => ({
        name: column.name,
        notNull: column.notNull,
        hasDefault: column.hasDefault,
        primary: column.primary,
      })),
    primaryKeys: config.primaryKeys.map((key) => key.columns.map((column) => column.name)),
    foreignKeys: config.foreignKeys.map((key) => {
      const reference = key.reference();

      return {
        name: key.getName(),
        columns: reference.columns.map((column) => column.name),
        foreignTable: getMysqlTableConfig(reference.foreignTable).name,
        foreignColumns: reference.foreignColumns.map((column) => column.name),
      };
    }),
    indexes: config.indexes.map((index) => ({
      name: index.config.name,
      unique: index.config.unique ?? false,
      columns: index.config.columns.flatMap((column) =>
        'name' in column ? [standingFor(column.name, hashes)] : [],
      ),
    })),
    uniques: config.columns.flatMap((column) =>
      column.isUnique
        ? [{ name: column.uniqueName ?? '', columns: [standingFor(column.name, hashes)] }]
        : [],
    ),
    checks: config.checks.map((check) => check.name),
  };
};

const postgresTables = new Map(
  Object.entries(PostgresSchema).flatMap(([name, value]) =>
    is(value, PgTable) ? [[name, value] as const] : [],
  ),
);

const mysqlTables = new Map(
  Object.entries(MysqlSchema).flatMap(([name, value]) =>
    is(value, MySqlTable) ? [[name, value] as const] : [],
  ),
);

describe('the Postgres and MySQL schemas', () => {
  it('export the same tables under the same names', () => {
    expect([...mysqlTables.keys()].toSorted()).toStrictEqual([...postgresTables.keys()].toSorted());
  });

  it.each([...postgresTables.keys()])('describe %s alike', (name) => {
    const postgres = postgresTables.get(name);
    const mysql = mysqlTables.get(name);

    expect(postgres).toBeDefined();
    expect(mysql).toBeDefined();

    if (postgres !== undefined && mysql !== undefined) {
      expect(mysqlShape(mysql)).toStrictEqual(postgresShape(postgres));
    }
  });

  it('keep only generated hash columns of their own', () => {
    const own = [...mysqlTables].flatMap(([name, table]) => {
      const postgres = postgresTables.get(name);
      const theirs = new Set(
        postgres === undefined
          ? []
          : getPostgresTableConfig(postgres).columns.map((column) => column.name),
      );

      return getMysqlTableConfig(table)
        .columns.filter((column) => !theirs.has(column.name))
        .map((column) => ({
          column: `${name}.${column.name}`,
          isHash: HASHES.test(column.name) && column.generated?.mode === 'stored',
        }));
    });

    expect(own.length).toBeGreaterThan(0);
    expect(own.filter((column) => !column.isHash)).toStrictEqual([]);
  });

  it('name every key short enough for MySQL to accept', () => {
    const tooLong = [...mysqlTables.values()].flatMap((table) => {
      const config = getMysqlTableConfig(table);

      return [
        config.name,
        ...config.foreignKeys.map((key) => key.getName()),
        ...config.indexes.map((index) => index.config.name),
        ...config.checks.map((check) => check.name),
        ...config.columns.flatMap((column) => [column.name, column.uniqueName ?? '']),
      ].filter((name) => name.length > MYSQL_NAME_LIMIT);
    });

    expect(tooLong).toStrictEqual([]);
  });

  it('group the tables better-auth and the server bind the same way', () => {
    expect(Object.keys(MysqlSchema.authSchema)).toStrictEqual(
      Object.keys(PostgresSchema.authSchema),
    );
    expect(Object.keys(MysqlSchema.valenceSchema)).toStrictEqual(
      Object.keys(PostgresSchema.valenceSchema),
    );
  });

  it('read and write rows of the same types', () => {
    expectTypeOf<
      WithoutOwnColumns<RowsOf<typeof MysqlSchema>, RowsOf<typeof PostgresSchema>>
    >().toEqualTypeOf<RowsOf<typeof PostgresSchema>>();
    expectTypeOf<
      WithoutOwnColumns<InsertsOf<typeof MysqlSchema>, InsertsOf<typeof PostgresSchema>>
    >().toEqualTypeOf<InsertsOf<typeof PostgresSchema>>();
  });
});
