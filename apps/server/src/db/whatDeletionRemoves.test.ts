import { getTableName, is } from 'drizzle-orm';
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import * as Schema from './Schema';
import {
  NAMES_AN_OWNER,
  ownerOfTable,
  WHAT_A_RULE_INSISTS_ON,
  WHAT_DELETION_REMOVES,
} from './whatDeletionRemoves';
import type { Owner } from './whatDeletionRemoves';

type Pointer = {
  table: string;
  column: string;
  owner: Owner;
  onDelete: string | undefined;
  isNullable: boolean;
};

const tables = [
  ...new Map(
    Object.values(Schema)
      .filter((one) => is(one, PgTable))
      .map((one) => [getTableName(one), one]),
  ).values(),
];

const pointersAtAnOwner = (): Pointer[] =>
  tables.flatMap((table) => {
    const config = getTableConfig(table);

    return config.foreignKeys.flatMap((key) => {
      const reference = key.reference();
      const owner = ownerOfTable(getTableName(reference.foreignTable));

      if (owner === null) {
        return [];
      }

      return reference.columns.map((column) => ({
        table: config.name,
        column: column.name,
        owner,
        onDelete: key.onDelete,
        isNullable: !column.notNull,
      }));
    });
  });

const columnsNamedAfterAnOwner = (): { table: string; column: string; hasReference: boolean }[] =>
  tables.flatMap((table) => {
    const config = getTableConfig(table);
    const referenced = new Set(
      config.foreignKeys.flatMap((key) => key.reference().columns.map((column) => column.name)),
    );

    return config.columns
      .filter((column) => NAMES_AN_OWNER.some((ending) => column.name.endsWith(ending)))
      .map((column) => ({
        table: config.name,
        column: column.name,
        hasReference: referenced.has(column.name),
      }));
  });

const address = (one: { table: string; column: string }) => `${one.table}.${one.column}`;

const declared = new Map(WHAT_DELETION_REMOVES.map((one) => [address(one), one]));

const columnOf = (table: string, column: string) => {
  const found = tables.find((one) => getTableName(one) === table);

  return found === undefined
    ? undefined
    : getTableConfig(found).columns.find((one) => one.name === column);
};

describe('what deleting an account, a profile or a library removes', () => {
  it('says it once for each table and column, so there is one answer rather than two', () => {
    expect(declared.size).toBe(WHAT_DELETION_REMOVES.length);
  });

  it('points every decision at a column that is really there', () => {
    const missing = WHAT_DELETION_REMOVES.filter(
      (one) => columnOf(one.table, one.column) === undefined,
    );

    expect(missing.map(address)).toEqual([]);
  });

  it('decides each case the way its rule insists on', () => {
    const against = WHAT_DELETION_REMOVES.filter(
      (one) => !WHAT_A_RULE_INSISTS_ON[one.rule].includes(one.fate),
    );

    expect(against.map((one) => `${address(one)} is ${one.rule} and ${one.fate}`)).toEqual([]);
  });
});

describe('what the schema does about it', () => {
  it('takes with its owner everything declared to go with it', () => {
    const wrong = WHAT_DELETION_REMOVES.filter((one) => one.fate === 'goesWithIt').filter((one) => {
      const pointer = pointersAtAnOwner().find((at) => address(at) === address(one));

      return pointer === undefined || pointer.onDelete !== 'cascade';
    });

    expect(wrong.map(address)).toEqual([]);
  });

  it('clears the name and keeps the row where what it names outlives its owner', () => {
    const wrong = WHAT_DELETION_REMOVES.filter((one) => one.fate === 'outlivesIt').filter((one) => {
      const pointer = pointersAtAnOwner().find((at) => address(at) === address(one));

      return pointer === undefined || pointer.onDelete !== 'set null' || !pointer.isNullable;
    });

    expect(wrong.map(address)).toEqual([]);
  });

  it('holds no reference where a column names an owner it deliberately does not point at', () => {
    const wrong = WHAT_DELETION_REMOVES.filter(
      (one) => one.fate === 'namesItWithoutHoldingIt',
    ).filter((one) => pointersAtAnOwner().some((at) => address(at) === address(one)));

    expect(wrong.map(address)).toEqual([]);
  });

  it('agrees with the schema about who owns what', () => {
    const wrong = pointersAtAnOwner().filter(
      (at) =>
        declared.get(address(at))?.owner !== undefined &&
        declared.get(address(at))?.owner !== at.owner,
    );

    expect(wrong.map(address)).toEqual([]);
  });
});

describe('what nobody has decided yet', () => {
  it('leaves nothing pointing at an account, a profile or a library undeclared', () => {
    const undeclared = pointersAtAnOwner().filter((at) => !declared.has(address(at)));

    expect(undeclared.map(address)).toEqual([]);
  });

  it('leaves no column named after an owner holding a reference nobody wrote down', () => {
    const undeclared = columnsNamedAfterAnOwner()
      .filter((one) => !one.hasReference)
      .filter((one) => !declared.has(address(one)));

    expect(undeclared.map(address)).toEqual([]);
  });
});

describe('the rule with a security consequence', () => {
  it('lets nothing that grants access outlive the account that holds it', () => {
    const surviving = WHAT_DELETION_REMOVES.filter(
      (one) => one.rule === 'grantsAccess' && one.fate !== 'goesWithIt',
    );

    expect(surviving.map(address)).toEqual([]);
  });

  it('counts a key, a session, a passkey and a share link among the things that grant it', () => {
    const granting = WHAT_DELETION_REMOVES.filter((one) => one.rule === 'grantsAccess').map(
      (one) => one.table,
    );

    expect(granting).toEqual(
      expect.arrayContaining(['apikey', 'session', 'passkey', 'share', 'deviceCode']),
    );
  });
});
