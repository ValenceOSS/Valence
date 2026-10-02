import { cleanup } from '@testing-library/react';
import { letUnmountingFinish } from '@ValenceCore/testing/letUnmountingFinish';

/**
 * Takes down what a test rendered, and lets what it left to do as it unmounted finish while there
 * is still a page for it.
 *
 * @returns Once the unmounting is over.
 */
const tidyAfterATest = async (): Promise<void> => {
  cleanup();
  await letUnmountingFinish();
};

export { tidyAfterATest };
