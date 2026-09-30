import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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

describe('FeatureVisual', () => {
  it.each(KINDS)(
    'draws the %s picture, hidden from assistive technology and out of reach unless it is for playing with',
    (kind) => {
      const { container } = render(<FeatureVisual kind={kind} />);
      const picture = container.firstElementChild;

      expect(picture).toHaveAttribute('aria-hidden', 'true');
      expect(picture?.textContent).not.toBe('');

      if (kind === 'reader') {
        expect(picture).not.toHaveAttribute('inert');
      } else {
        expect(picture).toHaveAttribute('inert');
      }
    },
  );

  it('sets a display name so devtools can identify it', () => {
    expect(FeatureVisual.displayName).toBe('FeatureVisual');
  });
});
