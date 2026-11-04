import { describe, expect, it } from 'vitest';
import { describeShareOpens } from './describeShareOpens';
import { anAdminShare } from '@ValenceScreens/testing/anAdminShare';

describe('describeShareOpens', () => {
  it('counts opens against the allowance where there is one', () => {
    expect(describeShareOpens(anAdminShare({ views: 2, viewCap: 5 }))).toBe('2 of 5');
  });

  it('says how often a link with no allowance was opened', () => {
    expect(describeShareOpens(anAdminShare())).toBe('Never');
    expect(describeShareOpens(anAdminShare({ views: 1 }))).toBe('Once');
    expect(describeShareOpens(anAdminShare({ views: 4 }))).toBe('4 times');
  });
});
