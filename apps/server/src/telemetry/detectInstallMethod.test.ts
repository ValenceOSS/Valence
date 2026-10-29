import { describe, expect, it } from 'vitest';
import { detectInstallMethod } from './detectInstallMethod';

/**
 * A filesystem holding only the files named, each with what it says.
 *
 * @param files - The files there are.
 * @returns How to look at it.
 */
const holding = (files: Record<string, string>) => ({
  exists: (path: string) => path in files,
  readFile: (path: string) => {
    const found = files[path];

    if (found === undefined) {
      throw new Error(path);
    }

    return found;
  },
});

describe('detectInstallMethod', () => {
  it('knows a Docker container by the file it leaves at the root', () => {
    expect(detectInstallMethod({ ...holding({ '/.dockerenv': '' }), nodeEnv: 'production' })).toBe(
      'docker',
    );
  });

  it('knows a Podman container too', () => {
    expect(
      detectInstallMethod({ ...holding({ '/run/.containerenv': '' }), nodeEnv: 'production' }),
    ).toBe('docker');
  });

  it('knows a container by the group its first process is in', () => {
    expect(
      detectInstallMethod({
        ...holding({ '/proc/1/cgroup': '0::/kubepods/besteffort/pod1' }),
        nodeEnv: 'production',
      }),
    ).toBe('docker');
  });

  it('calls a production build outside a container native', () => {
    expect(detectInstallMethod({ ...holding({}), nodeEnv: 'production' })).toBe('native');
  });

  it('calls anything else other, such as a source checkout', () => {
    expect(
      detectInstallMethod({ ...holding({ '/proc/1/cgroup': '0::/' }), nodeEnv: 'development' }),
    ).toBe('other');
  });
});
