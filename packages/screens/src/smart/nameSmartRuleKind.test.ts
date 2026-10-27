import { describe, expect, it } from 'vitest';
import { nameSmartRuleKind } from './nameSmartRuleKind';

describe('nameSmartRuleKind', () => {
  it('names each kind of rule', () => {
    expect(nameSmartRuleKind('liked')).toBe('Liked');
    expect(nameSmartRuleKind('plays')).toBe('Times played');
    expect(nameSmartRuleKind('watched')).toBe('Watched');
    expect(nameSmartRuleKind('ageRating')).toBe('Age rating');
  });
});
