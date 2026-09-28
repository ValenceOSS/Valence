import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ORBITAL } from '@ValenceUI/orbs/variants/ORBITAL';
import { MockFace } from './MockFace';

describe('MockFace', () => {
  it('draws somebody without an orb as their initial', () => {
    render(<MockFace name="Jonah" />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('draws somebody with an orb as the orb rather than an initial', () => {
    render(<MockFace name="Maya" orb={ORBITAL} />);

    expect(screen.queryByText('M')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MockFace.displayName).toBe('MockFace');
  });
});
