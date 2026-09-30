import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatsCard } from './StatsCard';

describe('StatsCard', () => {
  it('groups its facts under a heading it is named by', () => {
    render(
      <StatsCard name="Source">
        <dt>Video</dt>
        <dd>hevc</dd>
      </StatsCard>,
    );

    expect(screen.getByRole('region', { name: 'Source' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Source' })).toBeInTheDocument();
    expect(screen.getByText('hevc')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StatsCard.displayName).toBe('StatsCard');
  });
});
