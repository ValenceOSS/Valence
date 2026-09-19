import { describe, expect, it } from 'vitest';
import { readJsonSelector } from './readJsonSelector';
import { SelectorMiss } from './SelectorMiss';
import type { CardigannSelector } from './CardigannDefinitionSchema';

const ROW = {
  id: 7,
  name: 'Dune',
  genres: ['Drama', 'Sci-Fi'],
  freeleech: 1,
  files: [{ n: 'a' }],
  meta: { hash: 'ABC' },
  empty: null,
};

const CONTEXT = { variables: { '.Result._id': '7' }, encoding: 'UTF-8', nowMs: 0 };

/**
 * Reads from the row.
 */
const read = (block: Partial<CardigannSelector>, isRequired = true) =>
  readJsonSelector(ROW, { optional: false, filters: [], ...block }, CONTEXT, isRequired);

describe('readJsonSelector', () => {
  it('reads a value by path, dropping leading dots', () => {
    expect(read({ selector: 'name' })).toBe('Dune');
    expect(read({ selector: '..meta.hash' })).toBe('ABC');
    expect(read({ selector: 'id' })).toBe('7');
  });

  it('joins a list, and writes an object as JSON', () => {
    expect(read({ selector: 'genres' })).toBe('Drama,Sci-Fi');
    expect(read({ selector: 'files' })).toBe('{"n":"a"}');
    expect(read({ selector: 'meta' })).toBe('{"hash":"ABC"}');
  });

  it('reads fixed text through the templates, and applies filters', () => {
    expect(read({ text: 'browse/{{ .Result._id }}' })).toBe('browse/7');
    expect(read({ selector: 'name', filters: [{ name: 'toupper', args: null }] })).toBe('DUNE');
  });

  it('chooses the case equal to the value, with * as the fallback', () => {
    expect(read({ selector: 'freeleech', case: { '0': '1', '1': '0' } })).toBe('0');
    expect(read({ selector: 'id', case: { '1': 'one', '*': 'other' } })).toBe('other');
  });

  it('fails where something required is missing', () => {
    expect(() => read({ selector: 'missing' })).toThrow(SelectorMiss);
    expect(() => read({ selector: 'id', case: { '1': 'one' } })).toThrow(SelectorMiss);
  });

  it('reads nothing where something optional is missing, or is null', () => {
    expect(read({ selector: 'missing' }, false)).toBeNull();
    expect(read({ selector: 'id', case: { '1': 'one' } }, false)).toBeNull();
    expect(read({ selector: 'empty' }, false)).toBeNull();
  });
});
