import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatsSummary } from './StatsSummary';

describe('StatsSummary', () => {
  it('gives the few things that matter at a glance, each named', () => {
    render(
      <StatsSummary
        items={[
          { label: 'Mode', value: 'DirectPlay' },
          { label: 'Bitrate', value: null },
        ]}
      />,
    );

    expect(screen.getByLabelText('At a glance')).toBeInTheDocument();
    expect(screen.getByText('Mode').nextElementSibling).toHaveTextContent('DirectPlay');
    expect(screen.getByText('Bitrate').nextElementSibling).toHaveTextContent('—');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StatsSummary.displayName).toBe('StatsSummary');
  });
});
