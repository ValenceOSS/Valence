import { aFakeAudiobookPlayerWith } from '@ValenceClient/testing/aFakeAudiobookPlayerWith';

/**
 * An audiobook player over audio that plays nothing, whose events a test fires by hand, with
 * Jest's spies, for the television's screens to be drawn against.
 *
 * @returns The player, its audio, and what it was asked to keep.
 */
const aFakeAudiobookPlayer = (): ReturnType<typeof aFakeAudiobookPlayerWith<jest.Mock>> =>
  aFakeAudiobookPlayerWith(jest.fn);

export { aFakeAudiobookPlayer };
