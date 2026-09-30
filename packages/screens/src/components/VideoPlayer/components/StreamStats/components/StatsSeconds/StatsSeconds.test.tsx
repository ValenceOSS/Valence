import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatsSeconds } from './StatsSeconds';

describe('StatsSeconds', () => {
  it('writes seconds to one decimal place', () => {
    render(<StatsSeconds value={12.25} />);

    expect(screen.getByText('12.3s')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StatsSeconds.displayName).toBe('StatsSeconds');
  });
});
