import { describe, expect, it } from 'vitest';
import { describeShowStatus } from './describeShowStatus';

describe('describeShowStatus', () => {
  it('reads a status however it is written', () => {
    expect(describeShowStatus('  Returning Series ')).toMatchObject({
      kind: 'returning',
      tone: 'success',
    });
  });

  it('reads both spellings of cancelled as one', () => {
    expect(describeShowStatus('Canceled')).toEqual(describeShowStatus('cancelled'));
  });

  it('says nothing of a status it does not know', () => {
    expect(describeShowStatus('rumoured')).toBeNull();
  });
});
