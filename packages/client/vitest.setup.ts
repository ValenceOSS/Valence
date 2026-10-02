import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { installPlatform } from './src/platform/installPlatform';
import { aFakePlatform } from './src/testing/aFakePlatform';
import { tidyAfterATest } from './src/testing/tidyAfterATest';

/**
 * Tells the application it is running on a client, before anything asks it where its server is.
 *
 * Reading anything asks the platform for the device store, and `platformInUse` throws where nothing has been
 * installed — deliberately, so a client that forgets to say what it is fails at once. A test is a
 * client like any other, and one that has not said so is testing the wrong thing.
 *
 * Replaced before each test rather than forgotten after one, so a test's own teardown, and anything
 * it left running that finishes late, still has a client to ask rather than throwing.
 */
const installATestClient = (): void => {
  installPlatform(aFakePlatform());
};

beforeEach(installATestClient);

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
