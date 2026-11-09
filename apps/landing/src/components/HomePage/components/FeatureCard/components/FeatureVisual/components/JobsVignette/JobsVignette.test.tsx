import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JobsVignette } from './JobsVignette';

describe('JobsVignette', () => {
  it('lists the jobs an admin can run, with when each runs on its own', () => {
    render(<JobsVignette />);

    expect(screen.getAllByText('Scan for changes')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Daily at 03:00')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(JobsVignette.displayName).toBe('JobsVignette');
  });
});
