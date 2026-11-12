import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Library } from '@ValenceContracts/schemas/Library';
import { DiskUsageCard } from './DiskUsageCard';

vi.mock('@ValenceClient/admin/fetchAdmin', () => ({
  measureStorage: vi.fn(() => Promise.resolve(null)),
}));

const GB = 1024 ** 3;

const library = (overrides: Partial<Library> = {}): Library => ({
  id: 'lib_1',
  name: 'Films',
  kind: 'movies',
  path: '/media/films',
  itemCount: 42,
  lastScannedAt: new Date().toISOString(),
  ...overrides,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
  keepsShowsTogether: true,
  higherProfileAsks: 'ask',
});

const ARTWORK = { count: 10, bytes: 2 * GB, atMs: 0 };

const MEDIA = { mountPoint: '/media', totalBytes: 1000 * GB, availableBytes: 100 * GB };

const SECOND = { mountPoint: '/mnt/second', totalBytes: 2000 * GB, availableBytes: 1500 * GB };

describe('DiskUsageCard', () => {
  it('says the disks have not been measured where no library sits on one', () => {
    render(
      <DiskUsageCard
        disks={[]}
        libraries={[library()]}
        cache={null}
        artwork={null}
        bookPages={null}
      />,
    );

    expect(screen.getByText(/measured/i)).toBeInTheDocument();
  });

  it('leads with what is Valence’s on the disk, not everything the disk holds', () => {
    render(
      <DiskUsageCard
        disks={[MEDIA]}
        libraries={[library({ sizeBytes: 300 * GB })]}
        cache={null}
        artwork={ARTWORK}
        bookPages={null}
      />,
    );

    expect(screen.getByText('302 GB')).toHaveClass('text-4xl');
    expect(screen.getByText(/900 GB used on a/)).toBeInTheDocument();
  });

  it('offers no choice of drive where the libraries share one', () => {
    render(
      <DiskUsageCard
        disks={[MEDIA, SECOND]}
        libraries={[library({ sizeBytes: 300 * GB })]}
        cache={null}
        artwork={null}
        bookPages={null}
      />,
    );

    expect(screen.queryByRole('group', { name: 'Which drive to show' })).toBeNull();
  });

  it('offers each drive the libraries are spread over, the one with least room first', () => {
    render(
      <DiskUsageCard
        disks={[MEDIA, SECOND]}
        libraries={[
          library({ sizeBytes: 300 * GB }),
          library({
            id: 'lib_2',
            name: 'Shows',
            kind: 'shows',
            path: '/mnt/second/shows',
            sizeBytes: 400 * GB,
          }),
        ]}
        cache={null}
        artwork={ARTWORK}
        bookPages={null}
      />,
    );
    const drives = screen.getByRole('group', { name: 'Which drive to show' });

    expect(drives).toHaveTextContent('/media · 90% full');
    expect(drives).toHaveTextContent('/mnt/second · 25% full');
    expect(screen.getByText('302 GB')).toBeInTheDocument();
  });

  it('shows the drive chosen, its own libraries alone, with Valence’s files left on the first', () => {
    render(
      <DiskUsageCard
        disks={[MEDIA, SECOND]}
        libraries={[
          library({ sizeBytes: 300 * GB }),
          library({
            id: 'lib_2',
            name: 'Shows',
            kind: 'shows',
            path: '/mnt/second/shows',
            sizeBytes: 400 * GB,
          }),
        ]}
        cache={null}
        artwork={ARTWORK}
        bookPages={null}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /\/mnt\/second/ }));

    expect(screen.getByText('400 GB', { selector: '.text-4xl' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Films/ })).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DiskUsageCard.displayName).toBe('DiskUsageCard');
  });
});
