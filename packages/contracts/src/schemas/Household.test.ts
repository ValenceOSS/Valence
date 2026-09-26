import { describe, expect, it } from 'vitest';
import { HouseholdRequestSchema, HouseholdSchema, householdAvatarUrl } from './Household';

const A_HOUSEHOLD = {
  name: 'The Morgans',
  colour: '#3ac47d',
  avatar: { kind: 'initial', font: 'gilroy' },
  updatedAt: '2026-09-18T00:00:00.000Z',
};

describe('what a household is', () => {
  it('carries a name, a colour and a face, the way a person does', () => {
    expect(HouseholdSchema.parse(A_HOUSEHOLD)).toMatchObject({ name: 'The Morgans' });
  });

  it('takes a longer name than a person, since it is more than one of them', () => {
    expect(HouseholdSchema.parse({ ...A_HOUSEHOLD, name: 'a'.repeat(40) }).name).toHaveLength(40);
    expect(() => HouseholdSchema.parse({ ...A_HOUSEHOLD, name: 'a'.repeat(41) })).toThrow();
  });

  it('refuses a name that is nothing at all', () => {
    expect(() => HouseholdSchema.parse({ ...A_HOUSEHOLD, name: '' })).toThrow();
  });

  it('draws the same three kinds of face a profile does', () => {
    for (const avatar of [
      { kind: 'initial', font: 'gilroy' },
      { kind: 'drawn', style: 'bottts', seed: 'a-seed' },
      { kind: 'photo', isVideo: false, frame: null },
    ]) {
      expect(() => HouseholdSchema.parse({ ...A_HOUSEHOLD, avatar })).not.toThrow();
    }
  });
});

describe('changing a household', () => {
  it('takes any one thing on its own, since a step sets one at a time', () => {
    expect(() => HouseholdRequestSchema.parse({ name: 'Just the name' })).not.toThrow();
    expect(() => HouseholdRequestSchema.parse({ colour: '#3ac47d' })).not.toThrow();
    expect(() => HouseholdRequestSchema.parse({})).not.toThrow();
  });

  it('trims a name somebody typed with a space on the end', () => {
    expect(HouseholdRequestSchema.parse({ name: '  The Morgans  ' }).name).toBe('The Morgans');
  });
});

describe('where a household picture is served from', () => {
  it('changes address when the picture changes, so no cache holds the old one', () => {
    const first = householdAvatarUrl({ updatedAt: '2026-09-18T00:00:00.000Z' });
    const second = householdAvatarUrl({ updatedAt: '2026-09-18T01:00:00.000Z' });

    expect(first).not.toBe(second);
  });

  it('escapes the time rather than letting it shape the address', () => {
    expect(householdAvatarUrl({ updatedAt: 'a&b' })).toContain('a%26b');
  });
});
