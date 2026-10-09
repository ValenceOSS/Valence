import { describe, expect, it } from 'vitest';
import { othersAskingOf } from './othersAskingOf';

const PRIYA = { id: 'p', name: 'Priya' };
const SAM = { id: 's', name: 'Sam' };

describe('othersAskingOf', () => {
  it('is nothing where nobody else asked', () => {
    expect(othersAskingOf([PRIYA], 'p')).toBeNull();
  });

  it('names and counts the others', () => {
    expect(othersAskingOf([PRIYA, SAM, { id: 'a', name: 'Ali' }], 'p')).toEqual({
      names: 'Sam and Ali',
      count: 2,
    });
  });
});
