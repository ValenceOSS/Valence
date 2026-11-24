import { describe, expect, it } from 'vitest';
import { PERMISSIONS, RETIRED_PERMISSION_NAMES } from '@ValenceContracts/schemas/Permission';
import { PERMISSIONS_EVERY_APP_READS } from './PERMISSIONS_EVERY_APP_READS';

describe('PERMISSIONS_EVERY_APP_READS', () => {
  it('names only permissions that exist or were retired', () => {
    expect(
      [...PERMISSIONS_EVERY_APP_READS].filter(
        (grant) =>
          !PERMISSIONS.some((one) => one === grant) &&
          !RETIRED_PERMISSION_NAMES.some((one) => one === grant),
      ),
    ).toEqual([]);
  });

  it('keeps the retired names older apps still read', () => {
    expect(
      RETIRED_PERMISSION_NAMES.every((retired) => PERMISSIONS_EVERY_APP_READS.has(retired)),
    ).toBe(true);
  });

  it('leaves out playing from a source, which came after apps that are still out there', () => {
    expect(PERMISSIONS_EVERY_APP_READS.has('sources.play')).toBe(false);
    expect(PERMISSIONS_EVERY_APP_READS.has('requests.ask')).toBe(true);
  });
});
