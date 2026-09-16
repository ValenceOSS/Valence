import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
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

afterEach(() => {
  cleanup();
});
