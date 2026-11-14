import { describe, expect, it } from 'vitest';
import { partsForOne } from './partsForOne';
import type { AddedItem } from '@ValenceServer/notifications/summariseNewMedia';

const ITEMS: AddedItem[] = [];

describe('partsForOne', () => {
  it('sends an account the part for everybody, addressed to it alone', () => {
    expect(partsForOne([{ items: ITEMS }], 'ada')).toEqual([{ items: ITEMS, only: ['ada'] }]);
  });

  it('sends an account that asked for something its own part instead of the one for everybody', () => {
    expect(
      partsForOne(
        [
          { items: ITEMS, except: ['ada'] },
          { items: ITEMS, only: ['ada'] },
          { items: ITEMS, only: ['sam'] },
        ],
        'ada',
      ),
    ).toEqual([{ items: ITEMS, only: ['ada'] }]);
  });
});
