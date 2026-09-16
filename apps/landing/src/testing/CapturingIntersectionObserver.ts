class CapturingIntersectionObserver implements IntersectionObserver {
  static latest: CapturingIntersectionObserver | null = null;

  root: Element | Document | null = null;

  rootMargin = '';

  thresholds: ReadonlyArray<number> = [];

  observed: Element[] = [];

  isDisconnected = false;

  constructor(readonly callback: IntersectionObserverCallback) {
    CapturingIntersectionObserver.latest = this;
  }

  observe(target: Element): void {
    this.observed.push(target);
  }

  unobserve(): void {
    return undefined;
  }

  disconnect(): void {
    this.isDisconnected = true;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

const ZERO_RECT = new DOMRectReadOnly();

/**
 * Builds a bare `IntersectionObserverEntry` for feeding to a captured observer's callback, for a
 * test that needs to say a section is or isn't in view without a real layout to measure.
 *
 * @param id - The id of the element the entry is standing in for.
 * @param isIntersecting - Whether it should read as currently in view.
 * @param intersectionRatio - How much of it should read as in view.
 * @returns An entry that satisfies the type real DOM observers hand a callback.
 */
const entryFor = (
  id: string,
  isIntersecting: boolean,
  intersectionRatio: number,
): IntersectionObserverEntry => {
  const target = document.createElement('div');
  target.id = id;

  return {
    target,
    isIntersecting,
    intersectionRatio,
    boundingClientRect: ZERO_RECT,
    intersectionRect: ZERO_RECT,
    rootBounds: null,
    time: 0,
  };
};

export { CapturingIntersectionObserver, entryFor };
