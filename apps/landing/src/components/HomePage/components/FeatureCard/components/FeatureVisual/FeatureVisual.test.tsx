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
    'draws the %s picture, hidden from assistive technology and out of reach',
    (kind) => {
      const { container } = render(<FeatureVisual kind={kind} />);
      const picture = container.firstElementChild;

      expect(picture).toHaveAttribute('aria-hidden', 'true');
      expect(picture).toHaveAttribute('inert');
      expect(picture?.textContent).not.toBe('');
    },
  );

  it('sets a display name so devtools can identify it', () => {
    expect(FeatureVisual.displayName).toBe('FeatureVisual');
  });
});
