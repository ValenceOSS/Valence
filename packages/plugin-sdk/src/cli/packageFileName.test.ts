import { describe, expect, it } from 'vitest';
import { packageFileName } from './packageFileName';

describe('packageFileName', () => {
  it('names a package after its id and version', () => {
    expect(packageFileName('anilist', '1.2.3')).toBe('anilist-1.2.3.vplugin');
  });
});
