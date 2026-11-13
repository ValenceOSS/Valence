import { describe, expect, it } from 'vitest';
import { partsOf } from './partsOf';

describe('partsOf', () => {
  it('puts each filling where its gap falls, with nothing empty between them', () => {
    expect(partsOf('{name} likes this', { name: 7 })).toEqual([7, ' likes this']);
    expect(partsOf('Hi {who}', {})).toEqual(['Hi ', '{who}']);
  });
});
