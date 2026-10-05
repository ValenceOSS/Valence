import { describe, expect, it } from 'vitest';
import { isExactVersion } from './isExactVersion';

describe('isExactVersion', () => {
  it('takes one version, prereleases included', () => {
    expect(isExactVersion('4.1.11')).toBe(true);
    expect(isExactVersion('58.0.0-preview.7')).toBe(true);
    expect(isExactVersion('0.88.0-rc.1')).toBe(true);
  });

  it('refuses a range, which installs whatever is newest when the lockfile is next written', () => {
    expect(isExactVersion('^4.1.11')).toBe(false);
    expect(isExactVersion('~58.0.9')).toBe(false);
    expect(isExactVersion('>=1.0.0')).toBe(false);
    expect(isExactVersion('*')).toBe(false);
    expect(isExactVersion('latest')).toBe(false);
  });

  it('takes a workspace package, and a git package named by a commit or a version tag', () => {
    expect(isExactVersion('workspace:*')).toBe(true);
    expect(isExactVersion('github:castlabs/electron-releases#v44.1.0+wvcus')).toBe(true);
    expect(
      isExactVersion(
        'git+https://github.com/ValenceOSS/Valence.git#a2d5be9279d750007e1117152d26a3d365a98633&path:/packages/plugin-sdk',
      ),
    ).toBe(true);
  });

  it('refuses a git package named by a branch, or by nothing, which follows the branch', () => {
    expect(isExactVersion('github:ValenceOSS/Valence#main')).toBe(false);
    expect(isExactVersion('github:ValenceOSS/Valence#feat/val-297-plugin-system&path:/x')).toBe(
      false,
    );
    expect(isExactVersion('github:ValenceOSS/Valence')).toBe(false);
  });

  it('judges an npm alias by the version it names', () => {
    expect(isExactVersion('npm:react-native-tvos@0.86.3-0')).toBe(true);
    expect(isExactVersion('npm:@typescript/typescript6@^6.0.2')).toBe(false);
  });
});
