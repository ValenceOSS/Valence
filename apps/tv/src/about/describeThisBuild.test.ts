import Constants from 'expo-constants';
import { describeThisBuild } from '@ValenceTv/about/describeThisBuild';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('describeThisBuild', () => {
  it('names the release, the system and the server it talks to', () => {
    jest.replaceProperty(Constants, 'expoConfig', {
      name: 'Valence',
      slug: 'valence',
      extra: { build: { version: '1.4.0', commit: 'abc1234' } },
    });

    expect(
      describeThisBuild({ version: '1.4.0', commit: 'def5678', features: [] }, 'ios', '26.0'),
    ).toBe('Valence 1.4.0 (abc1234) · tvOS 26.0 · Server 1.4.0 (def5678)');
  });

  it('names Android by its API level', () => {
    expect(describeThisBuild(null, 'android', 36)).toBe('Android API 36');
  });

  it('leaves out what it does not know', () => {
    expect(describeThisBuild(null, 'ios', '26.0')).toBe('tvOS 26.0');
  });
});
