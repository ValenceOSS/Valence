import { describe, expect, it } from 'vitest';
import { aQualityProfile } from '@ValenceScreens/testing/aQualityProfile';
import { describeAskers } from './describeAskers';

describe('describeAskers', () => {
  it('says a profile naming nobody is anybody’s', () => {
    expect(describeAskers(aQualityProfile())).toBe('Anybody who may ask');
  });

  it('counts the roles and the people named on it', () => {
    expect(describeAskers(aQualityProfile({ roleIds: ['trusted'] }))).toBe('1 role');
    expect(describeAskers(aQualityProfile({ accountIds: ['dan', 'sam'] }))).toBe('2 people');
    expect(
      describeAskers(aQualityProfile({ roleIds: ['trusted', 'household'], accountIds: ['dan'] })),
    ).toBe('2 roles and 1 person');
  });

  it('says the default takes the choice away, whoever is named on it', () => {
    expect(describeAskers(aQualityProfile({ isDefault: true, roleIds: ['trusted'] }))).toBe(
      'Everything, with no choice',
    );
  });
});
