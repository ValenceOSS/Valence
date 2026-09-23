import { describe, expect, it } from 'vitest';
import { describeHiding } from './describeHiding';

describe('describeHiding', () => {
  it('asks about the thing by name', () => {
    expect(describeHiding({ kind: 'item', subjectId: 'm-1', title: 'Arrival' }, false).title).toBe(
      'Hide Arrival?',
    );
  });

  it('says a programme goes whole', () => {
    expect(
      describeHiding({ kind: 'series', subjectId: 's-1', title: 'Severance' }, false).detail,
    ).toMatch(/^Every episode of it disappears/u);
  });

  it('says only you lose it, where the account is shared', () => {
    expect(
      describeHiding({ kind: 'item', subjectId: 'm-1', title: 'Arrival' }, true).detail,
    ).toContain('for you and for nobody else on this account');
  });
});
