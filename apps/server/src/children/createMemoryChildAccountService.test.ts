import { describe, expect, it } from 'vitest';
import { createMemoryChildAccountService } from './createMemoryChildAccountService';

describe('createMemoryChildAccountService', () => {
  it('keeps whose child an account is, and whether it has a PIN', async () => {
    const children = createMemoryChildAccountService();

    await children.adopt('parent', 'kid');
    await children.setPinHash('kid', 'hash');

    expect(await children.ownerOf('kid')).toBe('parent');
    expect(await children.pinHashOf('kid')).toBe('hash');
    expect(await children.list('parent')).toEqual([{ userId: 'kid', hasPin: true }]);
    expect(await children.ownerOf('parent')).toBeNull();
  });
});
