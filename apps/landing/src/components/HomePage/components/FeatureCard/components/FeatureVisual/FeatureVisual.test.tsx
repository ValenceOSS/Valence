import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HardDriveIcon } from '@hugeicons/core-free-icons';
import { FeatureVisual } from './FeatureVisual';
import type { FeatureVisualKind } from './FeatureVisual.types';

const KINDS_WITH_ICON: FeatureVisualKind[] = ['window', 'orbit', 'stack'];

describe('FeatureVisual', () => {
  it.each(KINDS_WITH_ICON)('draws the %s kind around the feature’s own icon', (kind) => {
    const { container } = render(<FeatureVisual kind={kind} icon={HardDriveIcon} />);

    expect(container.querySelector('.valence-icon')).toBeInTheDocument();
  });

  it('draws the waveform kind as bars, without the feature’s own icon', () => {
    const { container } = render(<FeatureVisual kind="waveform" icon={HardDriveIcon} />);

    expect(container.querySelector('.valence-icon')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FeatureVisual.displayName).toBe('FeatureVisual');
  });
});
