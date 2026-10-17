import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DownloadProgress } from './DownloadProgress';

describe('DownloadProgress', () => {
  it('says how far a download has got, and how much has arrived', () => {
    render(
      <DownloadProgress title="Dune" progress={0.42}>
        1.2 GB of 4 GB
      </DownloadProgress>,
    );

    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByText('1.2 GB of 4 GB')).toBeInTheDocument();
  });

  it('leaves out the line beneath where there is nothing to say', () => {
    const { container } = render(<DownloadProgress title="Dune" progress={0.5} />);

    expect(container.querySelectorAll('.text-text-muted')).toHaveLength(0);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadProgress.displayName).toBe('DownloadProgress');
  });
});
