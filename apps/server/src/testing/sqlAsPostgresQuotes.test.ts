import { describe, expect, it } from 'vitest';
import { sqlAsPostgresQuotes } from './sqlAsPostgresQuotes';

describe('sqlAsPostgresQuotes', () => {
  it('quotes a MySQL identifier as Postgres would', () => {
    expect(sqlAsPostgresQuotes('select `share`.`id` from `share`')).toBe(
      'select "share"."id" from "share"',
    );
  });

  it('leaves Postgres SQL as it was', () => {
    expect(sqlAsPostgresQuotes('select "share"."id" from "share"')).toBe(
      'select "share"."id" from "share"',
    );
  });
});
