import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScanProgressBar } from './ScanProgressBar';

describe('ScanProgressBar', () => {
  it('names the phase it is in', () => {
    render(<ScanProgressBar label="Scanning Movies" phase="probing" processed={4} total={10} />);

    expect(screen.getByText('Probing')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Scanning Movies: Probing' }),
    ).toBeInTheDocument();
  });

  it('says it is stopping instead of the phase it was in once it has been asked to', () => {
    render(
      <ScanProgressBar
        label="Scanning Movies"
        phase="probing"
        processed={4}
        total={10}
        isStopping
      />,
    );

    expect(screen.getByText('Stopping')).toBeInTheDocument();
    expect(screen.queryByText('Probing')).not.toBeInTheDocument();
  });

  it('names the clearing of parts of a library', () => {
    render(
      <ScanProgressBar label="Clearing parts of Movies" phase="clearing" processed={1} total={3} />,
    );

    expect(screen.getByText('Clearing')).toBeInTheDocument();
  });

  it('reports how far through the current phase it is', () => {
    render(<ScanProgressBar label="Scanning Movies" phase="probing" processed={4} total={10} />);

    const bar = screen.getByRole('progressbar', { name: 'Scanning Movies: Probing' });

    expect(bar).toHaveAttribute('aria-valuenow', '4');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
    expect(within(bar).getByText('4')).toBeInTheDocument();
    expect(within(bar).getByText('10')).toBeInTheDocument();
  });

  it('reads an unrecognised phase name as-is, rather than hiding it', () => {
    render(
      <ScanProgressBar label="Scanning Movies" phase="detecting" processed={null} total={null} />,
    );

    expect(screen.getByText('detecting')).toBeInTheDocument();
  });

  it('names a stage with nothing to do, rather than going blank and pulsing', () => {
    render(<ScanProgressBar label="Scanning Movies" phase="trickplay" processed={0} total={0} />);

    expect(
      screen.getByRole('progressbar', { name: 'Scanning Movies: Generating scrub previews' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Generating scrub previews')).toBeInTheDocument();
    expect(screen.queryByText(/\//)).not.toBeInTheDocument();
  });

  it('has no phase or numeric value before the scan has reported anything', () => {
    render(<ScanProgressBar label="Scanning Movies" phase={null} processed={null} total={null} />);

    const bar = screen.getByRole('progressbar', { name: 'Scanning Movies' });

    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(screen.queryByText(/\//)).not.toBeInTheDocument();
  });
});

describe('ScanProgressBar, naming what it is on', () => {
  it('names the file it is working through', () => {
    render(
      <ScanProgressBar
        label="Movies"
        phase="probing"
        processed={4101}
        total={6277}
        item="Arrival (2016)"
      />,
    );

    expect(screen.getByText('Arrival (2016)')).toBeInTheDocument();
  });

  it('says nothing where the scan does not name one', () => {
    const { container } = render(
      <ScanProgressBar label="Movies" phase="probing" processed={1} total={2} item={null} />,
    );

    expect(container.textContent).not.toContain('undefined');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('keeps the whole name reachable for one that is too long to show', () => {
    const long = 'Some Very Long Release Name 2160p WEB-DL DDP5 1 HDR HEVC';

    render(<ScanProgressBar label="Movies" phase="probing" processed={1} total={2} item={long} />);

    expect(screen.getByTitle(long)).toBeInTheDocument();
  });
});
