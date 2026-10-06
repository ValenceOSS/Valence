import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FEATURE_GROUPS } from '@ValenceLanding/content/features';
import { FeatureBento } from './FeatureBento';

describe('FeatureBento', () => {
  it('sets every feature group out under one heading', () => {
    render(<FeatureBento />);

    expect(screen.getByRole('heading', { level: 2, name: /whole house/ })).toBeInTheDocument();

    for (const group of FEATURE_GROUPS) {
      expect(screen.getByRole('region', { name: group.title })).toBeInTheDocument();
    }
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FeatureBento.displayName).toBe('FeatureBento');
  });
});
