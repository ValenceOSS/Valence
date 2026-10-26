import { cleanup } from '@testing-library/react';
import { letUnmountingFinish } from '@ValenceCore/testing/letUnmountingFinish';
import { forgetTheKeptListening } from '@ValenceClient/downloads/theKeptListening';

/**
 * Takes down what a test rendered, lets what it left to do as it unmounted finish while there is
 * still a page for it, and forgets the music and audiobooks it kept.
 *
 * @returns Once the unmounting is over.
 */
const tidyAfterATest = async (): Promise<void> => {
  cleanup();
  await letUnmountingFinish();
  forgetTheKeptListening();
};

export { tidyAfterATest };
