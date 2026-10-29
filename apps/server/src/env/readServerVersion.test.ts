import { describe, expect, it } from 'vitest';
import { readServerVersion } from './readServerVersion';

const MANIFEST = () => '{".":"1.7.0"}';

describe('readServerVersion', () => {
  it('takes the version the image was built with', () => {
    expect(
      readServerVersion({ fromEnvironment: '1.8.0-dev.9790d38', readManifest: MANIFEST }),
    ).toBe('1.8.0-dev.9790d38');
  });

  it('reads the release manifest where nothing set the version', () => {
    expect(readServerVersion({ fromEnvironment: '0.0.0', readManifest: MANIFEST })).toBe('1.7.0');
    expect(readServerVersion({ fromEnvironment: '', readManifest: MANIFEST })).toBe('1.7.0');
  });

  it('says 0.0.0 where there is no manifest to read', () => {
    expect(
      readServerVersion({
        fromEnvironment: '0.0.0',
        readManifest: () => {
          throw new Error('ENOENT');
        },
      }),
    ).toBe('0.0.0');
  });

  it('says 0.0.0 where the manifest names no release', () => {
    expect(readServerVersion({ fromEnvironment: '0.0.0', readManifest: () => '{}' })).toBe('0.0.0');
  });
});
