import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@ValenceContracts/schemas/Permission';
import { PERMISSIONS_EVERY_APP_READS } from './PERMISSIONS_EVERY_APP_READS';

describe('PERMISSIONS_EVERY_APP_READS', () => {
  it('names only permissions that exist', () => {
    expect(
      [...PERMISSIONS_EVERY_APP_READS].every((grant) => PERMISSIONS.some((one) => one === grant)),
    ).toBe(true);
  });

  it('leaves out playing from a source, which came after apps that are still out there', () => {
    expect(PERMISSIONS_EVERY_APP_READS.has('sources.play')).toBe(false);
    expect(PERMISSIONS_EVERY_APP_READS.has('requests.ask')).toBe(true);
  });
});
