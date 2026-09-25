import { vi } from 'vitest';
import { aFakeAudiobookPlayerWith } from '@ValenceClient/testing/aFakeAudiobookPlayerWith';
import type { Mock } from 'vitest';

/**
 * An audiobook player over audio that plays nothing, whose events a test fires by hand, with
 * Vitest's spies.
 *
 * @returns The player, its audio, and what it was asked to keep.
 */
const aFakeAudiobookPlayer = (): ReturnType<typeof aFakeAudiobookPlayerWith<Mock>> =>
  aFakeAudiobookPlayerWith(vi.fn);

export { aFakeAudiobookPlayer };
