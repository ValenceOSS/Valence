import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import { tidyAfterATest } from './src/testing/tidyAfterATest';

afterEach(tidyAfterATest);

/**
 * Gives a screen longer to arrive than a second.
 *
 * `findBy` and `waitFor` wait on their own clock rather than the test's, and it defaults to one
 * second, which a loaded machine running everything at once can miss for a screen that is merely
 * slow to render. An element that never arrives still fails, a few seconds later.
 */
const waitLongEnoughForAScreen = (): void => {
  configure({ asyncUtilTimeout: 5_000 });
};

waitLongEnoughForAScreen();
