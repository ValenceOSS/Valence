import { describe, expect, it } from 'vitest';
import { describeOthersStillWanting } from './describeOthersStillWanting';

describe('describeOthersStillWanting', () => {
  it('says nothing where you alone asked', () => {
    expect(
      describeOthersStillWanting([{ id: 'p', name: 'Priya' }], { accountId: 'p', profileId: null }),
    ).toBeNull();
  });

  it('says it stays for the others', () => {
    expect(
      describeOthersStillWanting(
        [
          { id: 'p', name: 'Priya' },
          { id: 's', name: 'Sam' },
        ],
        { accountId: 'p', profileId: null },
      ),
    ).toBe('Sam still wants it, so it stays requested for them.');
  });
});
