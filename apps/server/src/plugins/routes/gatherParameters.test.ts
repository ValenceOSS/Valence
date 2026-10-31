import { describe, expect, it } from 'vitest';
import { gatherParameters } from './gatherParameters';

describe('gatherParameters', () => {
  it('keeps every value of a name in the order it came', () => {
    expect(
      gatherParameters([
        ['id', 'a'],
        ['f', 'json'],
        ['id', 'b'],
      ]),
    ).toEqual({ id: ['a', 'b'], f: ['json'] });
  });

  it('treats names every object has as ordinary parameters', () => {
    const gathered = gatherParameters([
      ['constructor', '1'],
      ['__proto__', '2'],
      ['toString', '3'],
    ]);

    expect(Object.keys(gathered)).toEqual(['constructor', '__proto__', 'toString']);
    expect(gathered['constructor']).toEqual(['1']);
    expect(Object.getPrototypeOf(gathered)).toBe(Object.prototype);
    expect(Object.hasOwn(gathered, '__proto__')).toBe(true);
  });
});
