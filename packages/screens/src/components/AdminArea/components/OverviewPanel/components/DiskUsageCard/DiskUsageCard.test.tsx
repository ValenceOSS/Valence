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

const MEDIA = {
  mountPoint: '/media',
  device: null,
  totalBytes: 1000 * GB,
  availableBytes: 100 * GB,
};

const SECOND = {
  mountPoint: '/mnt/second',
  device: null,
  totalBytes: 2000 * GB,
  availableBytes: 1500 * GB,
};

describe('DiskUsageCard', () => {
  it('says the disks have not been measured where no library sits on one', () => {
    render(
      <DiskUsageCard
        disks={[]}
        libraries={[library()]}
        cache={null}
        artefactRoot={null}
        artwork={null}
        bookPages={null}
      />,
    );

    expect(screen.getByText(/measured/i)).toBeInTheDocument();
  });

  it('leads with the room left on the drive, beside how big it is', () => {
    render(
      <DiskUsageCard
        disks={[MEDIA]}
        libraries={[library({ sizeBytes: 300 * GB })]}
        cache={null}
        artefactRoot={null}
        artwork={ARTWORK}
        bookPages={null}
      />,
    );

    expect(screen.getByText('100 GB', { selector: '.text-4xl' })).toBeInTheDocument();
    expect(screen.getByText('free of 1000 GB')).toBeInTheDocument();
  });

  it('offers no choice of drive where the libraries share one', () => {
    render(
      <DiskUsageCard
        disks={[MEDIA, SECOND]}
        libraries={[library({ sizeBytes: 300 * GB })]}
        cache={null}
        artefactRoot={null}
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
        artefactRoot={null}
        artwork={ARTWORK}
        bookPages={null}
      />,
    );
    const drives = screen.getByRole('group', { name: 'Which drive to show' });

    expect(drives).toHaveTextContent('/media · 90% full');
    expect(drives).toHaveTextContent('/mnt/second · 25% full');
    expect(screen.getByText('100 GB', { selector: '.text-4xl' })).toBeInTheDocument();
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
        artefactRoot={null}
        artwork={ARTWORK}
        bookPages={null}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /\/mnt\/second/ }));

    expect(screen.getByText('1.5 TB', { selector: '.text-4xl' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Films/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Valence’s files/ })).toBeNull();
  });

  it('counts Valence’s files on the drive holding its previews, not the first', () => {
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
        artefactRoot="/mnt/second/cache/artefacts"
        artwork={ARTWORK}
        bookPages={null}
      />,
    );

    expect(screen.queryByRole('button', { name: /Valence’s files/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /\/mnt\/second/ }));

    expect(screen.getByRole('button', { name: /Valence’s files/ })).toHaveTextContent('2.0 GB');
  });

  it('draws a ZFS pool as one drive, with Valence’s files and the rest on other datasets in it', () => {
    render(
      <DiskUsageCard
        disks={[
          { mountPoint: '/', device: 'overlay', totalBytes: 500 * GB, availableBytes: 400 * GB },
          {
            mountPoint: '/media',
            device: 'tank/media',
            totalBytes: 700 * GB,
            availableBytes: 400 * GB,
          },
          {
            mountPoint: '/cache',
            device: 'tank/apps',
            totalBytes: 450 * GB,
            availableBytes: 400 * GB,
          },
          {
            mountPoint: '/config',
            device: 'tank/apps',
            totalBytes: 450 * GB,
            availableBytes: 400 * GB,
          },
        ]}
        libraries={[library({ sizeBytes: 300 * GB })]}
        cache={null}
        artefactRoot="/cache/artefacts"
        artwork={ARTWORK}
        bookPages={null}
      />,
    );

    expect(screen.getByText('free of 750 GB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Valence’s files/ })).toHaveTextContent('2.0 GB');
    expect(screen.getByRole('button', { name: /Everything else/ })).toHaveTextContent('48 GB');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DiskUsageCard.displayName).toBe('DiskUsageCard');
  });
});
