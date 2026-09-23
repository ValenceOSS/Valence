import Constants from 'expo-constants';
import { Platform } from 'react-native';
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

    expect(describeThisBuild('def5678')).toBe(
      `Valence 1.4.0 (abc1234) · tvOS ${String(Platform.Version)} · Server def5678`,
    );
  });

  it('leaves out what it does not know', () => {
    expect(describeThisBuild(null)).toBe(`tvOS ${String(Platform.Version)}`);
  });
});
