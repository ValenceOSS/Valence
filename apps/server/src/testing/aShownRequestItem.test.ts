import { describe, expect, it } from 'vitest';
import { aShownRequestItem } from '@ValenceServer/testing/aShownRequestItem';

describe('aShownRequestItem', () => {
  it('waits for the film unless told otherwise', () => {
    expect(aShownRequestItem({})).toMatchObject({ state: 'wanted', season: null });
    expect(aShownRequestItem({ state: 'available' })).toMatchObject({ state: 'available' });
  });
});
