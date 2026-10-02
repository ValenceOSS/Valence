import { describe, expect, it } from 'vitest';
import { wordsOfCustomFormat } from './wordsOfCustomFormat';

/**
 * A release-name term of a custom format.
 */
const aTerm = (value: string, more: { negate?: boolean; required?: boolean } = {}) => ({
  name: value,
  implementation: 'ReleaseTitleSpecification',
  negate: more.negate ?? false,
  required: more.required ?? false,
  fields: [{ name: 'value', value }],
});

describe('wordsOfCustomFormat', () => {
  it('makes words of a format that only matches release names', () => {
    expect(
      wordsOfCustomFormat({
        id: 1,
        name: 'Repack',
        specifications: [aTerm('\\bRepack\\b'), aTerm('\\bProper\\b')],
      }),
    ).toEqual({ words: ['Repack', 'Proper'], isApproximate: false });
  });

  it('approximates one that needs every term at once or says what a name must not have', () => {
    expect(
      wordsOfCustomFormat({
        id: 1,
        name: 'Both',
        specifications: [aTerm('a', { required: true }), aTerm('b', { required: true })],
      })?.isApproximate,
    ).toBe(true);
    expect(
      wordsOfCustomFormat({
        id: 1,
        name: 'Not',
        specifications: [aTerm('a'), aTerm('b', { negate: true })],
      }),
    ).toEqual({ words: ['a'], isApproximate: true });
  });

  it('has none for a format that judges more than the name, or only what it must not have', () => {
    expect(
      wordsOfCustomFormat({
        id: 1,
        name: 'HDR',
        specifications: [
          aTerm('HDR'),
          { ...aTerm('2160'), implementation: 'ResolutionSpecification' },
        ],
      }),
    ).toBeNull();
    expect(
      wordsOfCustomFormat({ id: 1, name: 'Not', specifications: [aTerm('a', { negate: true })] }),
    ).toBeNull();
    expect(wordsOfCustomFormat({ id: 1, name: 'Empty', specifications: [] })).toBeNull();
  });
});
