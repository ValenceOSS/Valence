import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SpeedReadout } from './SpeedReadout';

describe('SpeedReadout', () => {
  it('puts each direction on a line of its own', () => {
    render(<SpeedReadout down={20_971_520} up={0} />);

    expect(screen.getByText('↓ 20 MB/s')).toBeInTheDocument();
    expect(screen.getByText('↑ 0 B/s')).toBeInTheDocument();
  });

  it('shows a dash where neither is known', () => {
    render(<SpeedReadout down={null} up={null} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SpeedReadout.displayName).toBe('SpeedReadout');
  });
});
