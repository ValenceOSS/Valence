import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { onTestFinished } from 'vitest';

/**
 * Makes a folder of files for a test, such as a stand-in cgroup or `/proc` filesystem, removed again
 * once the test is over.
 *
 * @param files - Each file's path inside the folder, and what it holds.
 * @returns The folder.
 */
const aFolderOf = async (files: Record<string, string>): Promise<string> => {
  const folder = await mkdtemp(join(tmpdir(), 'valence-requests-'));

  onTestFinished(() => rm(folder, { recursive: true, force: true }));

  for (const [name, contents] of Object.entries(files)) {
    await mkdir(join(folder, name, '..'), { recursive: true });
    await writeFile(join(folder, name), contents);
  }

  return folder;
};

export { aFolderOf };
