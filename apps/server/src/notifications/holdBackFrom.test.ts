import { describe, expect, it } from 'vitest';
import { holdBackFrom } from './holdBackFrom';
import type { AddedItem } from '@ValenceServer/notifications/summariseNewMedia';

const ITEMS: AddedItem[] = [];

describe('holdBackFrom', () => {
  it('leaves a digest as it is where nobody is held back', () => {
    const parts = [{ items: ITEMS }];

    expect(holdBackFrom(parts, [])).toEqual(parts);
  });

  it('keeps the accounts held back out of the part for everybody', () => {
    expect(holdBackFrom([{ items: ITEMS, except: ['asker'] }], ['limited'])).toEqual([
      { items: ITEMS, except: ['asker', 'limited'] },
    ]);
    expect(holdBackFrom([{ items: ITEMS }], ['limited'])).toEqual([
      { items: ITEMS, except: ['limited'] },
    ]);
  });

  it('drops a part meant only for an account held back', () => {
    expect(
      holdBackFrom(
        [
          { items: ITEMS, only: ['limited'] },
          { items: ITEMS, only: ['asker'] },
        ],
        ['limited'],
      ),
    ).toEqual([{ items: ITEMS, only: ['asker'] }]);
  });
});
