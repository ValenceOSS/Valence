import { describe, expect, it } from 'vitest';
import { customFormatOf } from './customFormatOf';

/**
 * A custom format's specification, matching on the value given.
 */
const aSpecification = (
  implementation: string,
  value: string | number,
  fields: Record<string, number> = {},
) => ({
  name: implementation,
  implementation,
  negate: false,
  required: false,
  fields: [
    { name: 'value', value },
    ...Object.entries(fields).map(([name, given]) => ({ name, value: given })),
  ],
});

describe('customFormatOf', () => {
  it('carries each specification as a condition, numbering sources as each app does', () => {
    const format = {
      id: 1,
      name: 'Good',
      specifications: [
        aSpecification('SourceSpecification', 6),
        aSpecification('ResolutionSpecification', 2160),
        aSpecification('QualityModifierSpecification', 5),
        aSpecification('ReleaseGroupSpecification', 'GRP'),
        aSpecification('SizeSpecification', 0, { min: 1, max: 20 }),
      ],
    };

    expect(customFormatOf(format, 50, 'radarr')).toMatchObject({
      format: {
        name: 'Good',
        score: 50,
        conditions: [
          { kind: 'source', value: 'hdtv' },
          { kind: 'resolution', value: '2160p' },
          { kind: 'source', value: 'remux' },
          { kind: 'group', value: 'GRP' },
          { kind: 'size', value: '1-20' },
        ],
      },
      isApproximate: false,
    });
    expect(customFormatOf(format, 50, 'sonarr')?.format.conditions[0]).toMatchObject({
      kind: 'source',
      value: 'bluray',
    });
  });

  it('leaves out what has no match, saying so, and gives nothing where nothing matched', () => {
    const indexer = aSpecification('IndexerFlagSpecification', 1);

    expect(
      customFormatOf(
        {
          id: 1,
          name: 'Mixed',
          specifications: [indexer, aSpecification('LanguageSpecification', 4)],
        },
        10,
        'radarr',
      ),
    ).toMatchObject({
      isApproximate: true,
      format: { conditions: [{ kind: 'language', value: 'de' }] },
    });
    expect(
      customFormatOf({ id: 2, name: 'Flags', specifications: [indexer] }, 10, 'radarr'),
    ).toBeNull();
  });
});
