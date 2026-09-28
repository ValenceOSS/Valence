import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HdrVignette } from './HdrVignette';

describe('HdrVignette', () => {
  it('sets the flattened picture beside the one that stays HDR', () => {
    render(<HdrVignette />);

    expect(screen.getAllByText('HDR10')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HdrVignette.displayName).toBe('HdrVignette');
  });
});
