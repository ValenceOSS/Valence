import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import { tidyAfterATest } from './src/testing/tidyAfterATest';
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

/**
 * Says there is nothing to draw on, on a jsdom that cannot draw.
 *
 * jsdom implements no 2D canvas, and rather than answering the question it reports a
 * not-implemented error to the console the test runner is watching — which fails the run without
 * failing a test. Answering null is both true and the answer the components already handle, since a
 * real browser returns null for a context it cannot give either.
 */
const answerCanvasQuestions = (): void => {
  if (typeof HTMLCanvasElement === 'undefined') {
    return;
  }

  HTMLCanvasElement.prototype.getContext = () => null;
};

answerCanvasQuestions();

/**
 * Gives elements the pointer-capture methods, on a jsdom that has none.
 *
 * A control that tracks a drag captures the pointer so that leaving its bounds does not drop the
 * gesture. jsdom implements no part of that, so a slider merely being dragged throws — which is a
 * test failing for the absence of a pointer rather than for anything the component did.
 */
const answerPointerCapture = (): void => {
  if (typeof Element === 'undefined' || typeof Element.prototype.hasPointerCapture === 'function') {
    return;
  }

  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
};

answerPointerCapture();

class AlwaysInView implements IntersectionObserver {
  readonly root = null;

  readonly rootMargin = '0px';

  readonly thresholds = [0];

  private readonly report: IntersectionObserverCallback;

  constructor(report: IntersectionObserverCallback) {
    this.report = report;
  }

  observe(target: Element): void {
    const bounds = target.getBoundingClientRect();

    this.report(
      [
        {
          target,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: bounds,
          intersectionRect: bounds,
          rootBounds: null,
          time: 0,
        },
      ],
      this,
    );
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
  globalThis.IntersectionObserver = AlwaysInView;
}

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = LayoutlessResizeObserver;
}

MotionGlobalConfig.skipAnimations = true;

if (!('PointerEvent' in globalThis)) {
  Object.defineProperty(globalThis, 'PointerEvent', {
    configurable: true,
    value: MouseEvent,
  });
}

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
