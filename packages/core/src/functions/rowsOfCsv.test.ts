import { describe, expect, it } from 'vitest';
import { rowsOfCsv } from './rowsOfCsv';

describe('rowsOfCsv', () => {
  it('reads rows of cells, quoted ones holding commas, quotes and new lines', () => {
    expect(rowsOfCsv('a,b\r\n"one, two","say ""hi""\nthere"\n')).toEqual([
      ['a', 'b'],
      ['one, two', 'say "hi"\nthere'],
    ]);
  });

  it('takes off the apostrophe an export guards a formula with, and passes over empty rows', () => {
    expect(rowsOfCsv("'=1+1,'plain\n\n,\nlast")).toEqual([['=1+1', "'plain"], ['last']]);
  });
});
