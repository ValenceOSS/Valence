import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadRootEnvironment } from './loadRootEnvironment';

describe('loadRootEnvironment', () => {
  afterEach(() => {
    delete process.env.LOAD_ROOT_ENVIRONMENT_TEST;
  });

  it('reads the variables the file sets', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'env-')), '.env');
    writeFileSync(file, 'LOAD_ROOT_ENVIRONMENT_TEST=read\n');

    loadRootEnvironment(file);

    expect(process.env.LOAD_ROOT_ENVIRONMENT_TEST).toBe('read');
  });

  it('carries on where there is no file to read', () => {
    expect(() => {
      loadRootEnvironment(join(tmpdir(), 'no-such-directory', '.env'));
    }).not.toThrow();
    expect(process.env.LOAD_ROOT_ENVIRONMENT_TEST).toBeUndefined();
  });
});
