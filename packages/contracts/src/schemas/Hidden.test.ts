import { describe, expect, it } from 'vitest';
import { HiddenListSchema, HiddenSchema, hiddenAddressOf } from './Hidden';

const ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

describe('what somebody has hidden', () => {
  it('carries enough to draw a row and to bring the thing back', () => {
    const parsed = HiddenSchema.parse({
      kind: 'series',
      subjectId: ID,
      title: 'Curb Your Enthusiasm',
      hiddenAt: '2026-09-16T00:00:00.000Z',
    });

    expect(parsed.title).toBe('Curb Your Enthusiasm');
  });

  it('refuses a kind of thing that cannot be hidden', () => {
    expect(() =>
      HiddenSchema.parse({
        kind: 'person',
        subjectId: ID,
        title: 'Somebody',
        hiddenAt: '2026-09-16T00:00:00.000Z',
      }),
    ).toThrow();
  });

  it('refuses a subject that is not an identifier', () => {
    expect(() =>
      HiddenSchema.parse({
        kind: 'item',
        subjectId: 'not-an-identifier',
        title: 'Arrival',
        hiddenAt: '2026-09-16T00:00:00.000Z',
      }),
    ).toThrow();
  });

  it('reads an empty list as an empty list rather than as nothing', () => {
    expect(HiddenListSchema.parse({ hidden: [] }).hidden).toEqual([]);
  });
});

describe('where a subject’s hiding is reached', () => {
  it.each([
    ['item', `/api/media/${ID}/hidden`],
    ['series', `/api/series/${ID}/hidden`],
    ['library', `/api/libraries/${ID}/hidden`],
  ] as const)('puts a %s under the address that thing already has', (kind, expected) => {
    expect(hiddenAddressOf({ kind, subjectId: ID })).toBe(expected);
  });
});
