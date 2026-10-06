import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import { tidyAfterATest } from './src/testing/tidyAfterATest';
import '@valence/ui/src/testing/stubTheLight';
import { MotionGlobalConfig } from 'motion/react';

class LayoutlessResizeObserver implements ResizeObserver {
  observe(): void {
    return undefined;
  }

  unobserve(): void {
    return undefined;
  }

  disconnect(): void {
    return undefined;
  }
}

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = LayoutlessResizeObserver;
}

class UnwatchedIntersectionObserver implements IntersectionObserver {
  root: Element | Document | null = null;

  rootMargin = '';

  thresholds: ReadonlyArray<number> = [];

  observe(): void {
    return undefined;
  }

  unobserve(): void {
    return undefined;
  }

  disconnect(): void {
    return undefined;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (!('IntersectionObserver' in globalThis)) {
  globalThis.IntersectionObserver = UnwatchedIntersectionObserver;
}

MotionGlobalConfig.skipAnimations = true;

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
