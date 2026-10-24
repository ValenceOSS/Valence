import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FeatureVisual } from './FeatureVisual';
import type { FeatureVisualKind } from './FeatureVisual.types';

const KINDS: FeatureVisualKind[] = [
  'devices',
  'hdr',
  'skips',
  'reader',
  'party',
  'shareLink',
  'offline',
  'notifications',
  'sessions',
  'webhooks',
  'setup',
  'contract',
  'apiKeys',
  'plugins',
  'terminal',
  'household',
  'auth',
];

class SeenAtOnce implements IntersectionObserver {
  readonly root = null;

  readonly rootMargin = '0px';

  readonly thresholds = [0];

  readonly scrollMargin = '0px';

  constructor(protected readonly told: IntersectionObserverCallback) {}

  observe(target: Element): void {
    this.told(
      [
        {
          target,
          isIntersecting: true,
          intersectionRatio: 1,
          time: 0,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
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

class NeverSeen extends SeenAtOnce {
  override observe(target: Element): void {
    this.told(
      [
        {
          target,
          isIntersecting: false,
          intersectionRatio: 0,
          time: 0,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
        },
      ],
      this,
    );
  }
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', SeenAtOnce);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FeatureVisual', () => {
  it.each(KINDS)(
    'draws the %s picture, hidden from assistive technology and out of reach unless it is for playing with',
    async (kind) => {
      const { container } = render(<FeatureVisual kind={kind} />);
      const picture = container.firstElementChild;

      expect(picture).toHaveAttribute('aria-hidden', 'true');

      await waitFor(() => {
        expect(picture?.textContent).not.toBe('');
      });

      if (kind === 'reader') {
        expect(picture).not.toHaveAttribute('inert');
      } else {
        expect(picture).toHaveAttribute('inert');
      }
    },
  );

  it('fetches and draws nothing until the card nears the screen', async () => {
    vi.stubGlobal('IntersectionObserver', NeverSeen);

    const { container } = render(<FeatureVisual kind="devices" />);

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(container.firstElementChild?.textContent).toBe('');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FeatureVisual.displayName).toBe('FeatureVisual');
  });
});
