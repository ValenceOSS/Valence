import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createRcloneMachinery } from './createRcloneMachinery';

describe('createRcloneMachinery', () => {
  it('says an ordinary folder has nothing mounted on it', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-bucket-'));

    await expect(createRcloneMachinery('rclone').isMounted(folder)).resolves.toBe(false);
  });

  it('answers that a run failed where there is no such program, rather than throwing', async () => {
    const ran = await createRcloneMachinery('no-such-rclone-here').run(['version'], {}, 5000);

    expect(ran.ok).toBe(false);
  });

  it('makes the folder and its cache ready to mount on', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-bucket-'));
    const machinery = createRcloneMachinery('rclone');

    await machinery.prepare(join(folder, 'films'), join(folder, 'cache'));

    await expect(machinery.isMounted(join(folder, 'films'))).resolves.toBe(false);
  });
});
