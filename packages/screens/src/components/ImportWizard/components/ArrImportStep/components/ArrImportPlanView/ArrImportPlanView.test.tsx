import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { ArrImportPlan } from '@ValenceContracts/schemas/ArrImport';
import { ArrImportPlanView } from './ArrImportPlanView';

const PLAN: ArrImportPlan = {
  sources: [
    {
      kind: 'overseerr',
      url: 'http://overseerr:5055',
      name: 'Overseerr',
      version: '1.35.0',
      foundThrough: null,
      problem: null,
    },
    {
      kind: 'radarr',
      url: 'http://radarr:7878',
      name: 'Radarr',
      version: '5.14.0',
      foundThrough: 'Overseerr',
      problem: null,
    },
    {
      kind: 'lidarr',
      url: 'http://lidarr:8686',
      name: 'Lidarr',
      version: null,
      foundThrough: null,
      problem: sayVerbatim('Couldn’t connect to Lidarr'),
    },
  ],
  clients: [
    {
      key: 'q',
      name: 'qBittorrent',
      implementation: 'QBittorrent',
      kind: 'qbittorrent',
      url: 'http://qbittorrent:8080',
      from: ['Radarr'],
      standing: 'new',
      notes: [],
    },
    {
      key: 'd',
      name: 'Deluge',
      implementation: 'Deluge',
      kind: null,
      url: null,
      from: ['Radarr'],
      standing: 'unsupported',
      notes: [sayVerbatim('Valence doesn’t support Deluge yet.')],
    },
  ],
  indexers: [],
  prowlarr: { name: 'Prowlarr', url: 'http://prowlarr:9696', indexerCount: 12, standing: 'kept' },
  profiles: [
    {
      key: 'video:hd-1080p',
      name: 'HD-1080p',
      kind: 'video',
      from: 'Radarr',
      standing: 'new',
      notes: [sayVerbatim('Valence has no equivalent for BR-DISK, so they weren’t imported.')],
    },
  ],
  libraries: [
    {
      libraryId: 'films',
      libraryName: 'Films',
      libraryKind: 'movies',
      appName: 'Radarr',
      appUrl: 'http://radarr:7878',
      rootFolders: ['/movies'],
      isGuessed: false,
      profileName: 'HD-1080p',
    },
  ],
  unplacedFolders: [{ from: 'Radarr', path: '/movies4k' }],
  wanted: { films: 3, series: 1, artists: 0, requests: 2, unaskable: 1 },
  secrets: [
    {
      key: 'client:q:password',
      field: 'password',
      item: 'qBittorrent',
      from: ['Radarr', 'Sonarr'],
    },
  ],
};

describe('ArrImportPlanView', () => {
  it('shows what would be brought in, what cannot, and how much was waited for', () => {
    render(
      <ArrImportPlanView
        plan={PLAN}
        secrets={{}}
        choices={{}}
        isDisabled={false}
        onSecretChange={vi.fn()}
        onChoose={vi.fn()}
      />,
    );

    expect(screen.getByText('http://radarr:7878, found through Overseerr')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Couldn’t connect to Lidarr');
    expect(screen.getByText('Valence doesn’t support Deluge yet.')).toBeInTheDocument();
    expect(screen.getByText('12 indexers through Prowlarr')).toBeInTheDocument();
    expect(screen.getByText('/movies4k, from Radarr')).toBeInTheDocument();
    expect(screen.getByText('3 monitored films with no file yet')).toBeInTheDocument();
    expect(screen.getByText('1 title has no ID Valence can request it by')).toBeInTheDocument();
  });

  it('asks again for each secret shown masked, and passes on each library’s choice', async () => {
    const onSecretChange = vi.fn();
    const onChoose = vi.fn();

    render(
      <ArrImportPlanView
        plan={PLAN}
        secrets={{}}
        choices={{}}
        isDisabled={false}
        onSecretChange={onSecretChange}
        onChoose={onChoose}
      />,
    );

    await userEvent.type(screen.getByLabelText('Password for qBittorrent'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Valence downloads' }));

    expect(onSecretChange).toHaveBeenCalledWith('client:q:password', 'x');
    expect(onChoose).toHaveBeenCalledWith('films', 'takeOver');
  });
});
