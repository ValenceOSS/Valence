import { expect, vi } from 'vitest';
import { filesOfKeptListening } from '@ValenceClient/downloads/filesOfKeptListening';
import type { FakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import type { KeptListening } from '@ValenceContracts/schemas/KeptListening';

/**
 * Finishes every file of something kept, each as soon as the device asks for it, so a test can
 * start from a download that has all arrived.
 *
 * @param fake - Where the device keeps its songs and audiobooks.
 * @param kept - What it is keeping.
 * @returns Once the last file has arrived.
 */
const fetchEveryFileOf = async (fake: FakeListeningFiles, kept: KeptListening): Promise<void> => {
  for (const file of filesOfKeptListening(kept, fake.files.canPlay)) {
    await vi.waitFor(() => {
      expect(fake.isFetching(file.name)).toBe(true);
    });
    fake.finish(file.name);
  }
};

export { fetchEveryFileOf };
