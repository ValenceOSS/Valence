import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JobsPicture } from './JobsPicture';

describe('JobsPicture', () => {
  it('lists the jobs on the app’s own rows, each with its schedule and a button to run it', () => {
    render(<JobsPicture />);

    expect(screen.getByText('Scan for changes')).toBeInTheDocument();
    expect(screen.getByText('Generate missing scrub previews')).toBeInTheDocument();
    expect(screen.getByText('Daily at 03:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Scan for changes' })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows the scan running once acted out, with a button to stop it', () => {
    render(
      <JobsPicture
        scan={{ phase: 'probing', processed: 120, total: 312, item: null, isStopping: false }}
      />,
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '120');
    expect(screen.getByRole('button', { name: 'Stop Scan for changes' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(JobsPicture.displayName).toBe('JobsPicture');
  });
});
