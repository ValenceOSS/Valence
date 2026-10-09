import { describe, expect, it } from 'vitest';
import { describeAskers } from './describeAskers';

const PRIYA = { id: 'p', name: 'Priya' };
const SAM = { id: 's', name: 'Sam' };
const ALI = { id: 'a', name: 'Ali' };

describe('describeAskers', () => {
  it('says you alone asked', () => {
    expect(describeAskers([PRIYA], 'p')).toBe('Requested by you');
  });

  it('names whoever else asked with you', () => {
    expect(describeAskers([SAM, PRIYA], 'p')).toBe('Requested by you and Sam');
  });

  it('names everybody who asked, where you did not', () => {
    expect(describeAskers([PRIYA, SAM, ALI], 'x')).toBe('Requested by Priya, Sam and Ali');
  });
});
