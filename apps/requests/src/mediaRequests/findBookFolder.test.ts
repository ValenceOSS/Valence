import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findBookFolder } from '@ValenceRequests/mediaRequests/findBookFolder';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-shelf-'));
  await mkdir(join(root, 'Pierce Brown', 'Red Rising', '2 - Golden Son'), { recursive: true });
  await mkdir(join(root, 'Pierce Brown', 'Light Bringer'), { recursive: true });
  await mkdir(join(root, 'Dune'), { recursive: true });
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('findBookFolder', () => {
  it('finds a book kept in its author’s folder', async () => {
    expect(await findBookFolder(root, 'Pierce Brown', 'light bringer')).toBe(
      join(root, 'Pierce Brown', 'Light Bringer'),
    );
  });

  it('finds a book kept in one of its author’s series, whatever its place', async () => {
    expect(await findBookFolder(root, 'Pierce Brown', 'Golden Son')).toBe(
      join(root, 'Pierce Brown', 'Red Rising', '2 - Golden Son'),
    );
  });

  it('finds a book kept with no author', async () => {
    expect(await findBookFolder(root, null, 'Dune')).toBe(join(root, 'Dune'));
  });

  it('finds nothing the library does not have', async () => {
    expect(await findBookFolder(root, 'Pierce Brown', 'Morning Star')).toBeNull();
    expect(await findBookFolder(root, 'Nobody', 'Dune')).toBeNull();
  });
});
