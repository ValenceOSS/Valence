import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { theInstallMark } from './theInstallMark';

describe('theInstallMark', () => {
  let folder = '';

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), 'valence-install-mark-'));
  });

  afterEach(async () => {
    await rm(folder, { recursive: true, force: true });
  });

  it('carries the version being installed across to the next launch', async () => {
    theInstallMark(folder).leave('1.5.0');

    expect(await readFile(join(folder, 'installing'), 'utf8')).toBe('1.5.0');
    expect(theInstallMark(folder).take()).toBe('1.5.0');
  });

  it('is taken once, so a later launch is not told about an install that was already seen', () => {
    const mark = theInstallMark(folder);

    mark.leave('1.5.0');
    mark.take();

    expect(mark.take()).toBeNull();
  });

  it('finds nothing where nothing was installed', () => {
    expect(theInstallMark(folder).take()).toBeNull();
  });
});
