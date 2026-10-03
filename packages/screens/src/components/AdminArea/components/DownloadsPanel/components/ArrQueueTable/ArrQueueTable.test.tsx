import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ArrQueueTable } from './ArrQueueTable';

const RADARR = {
  id: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
  name: 'Films',
  kind: 'radarr' as const,
  problem: null,
  problemCode: null,
};

describe('ArrQueueTable', () => {
  it('shows what each app is downloading, how far along, and what is wrong', () => {
    renderInAnAddress(
      <ArrQueueTable
        queue={{
          apps: [
            RADARR,
            {
              id: '6b2e3d4c-5f6a-4b7c-9d8e-0f1a2b3c4d5e',
              name: 'Series',
              kind: 'sonarr',
              problem: sayVerbatim('Couldn’t connect to Series'),
              problemCode: 'ArrAppUnreachable',
            },
          ],
          items: [
            {
              id: 5,
              appId: RADARR.id,
              title: 'Dune.2021.1080p',
              status: 'downloading',
              progress: 0.5,
              sizeBytes: 2000,
              leftBytes: 1000,
              secondsLeft: 600,
              downloadClient: 'qBittorrent',
              problem: null,
            },
            {
              id: 6,
              appId: RADARR.id,
              title: 'Arrival.2016.2160p',
              status: 'importPending',
              progress: 1,
              sizeBytes: 3000,
              leftBytes: null,
              secondsLeft: null,
              downloadClient: null,
              problem: sayVerbatim('No files found are eligible for import'),
            },
            {
              id: 7,
              appId: 'gone',
              title: 'Heat.1995',
              status: 'queued',
              progress: 0,
              sizeBytes: null,
              leftBytes: null,
              secondsLeft: null,
              downloadClient: null,
              problem: null,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Dune.2021.1080p')).toBeInTheDocument();
    expect(screen.getByText('qBittorrent')).toBeInTheDocument();
    expect(screen.getByText('No files found are eligible for import')).toBeInTheDocument();
    expect(screen.getByText('Heat.1995')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Series: Couldn’t connect to Series');
  });

  it('says nothing is downloading, or that no app is there to download anything', () => {
    const { unmount } = renderInAnAddress(<ArrQueueTable queue={{ apps: [RADARR], items: [] }} />);

    expect(screen.getByText('Nothing is downloading in the connected apps.')).toBeInTheDocument();

    unmount();
    renderInAnAddress(<ArrQueueTable queue={{ apps: [], items: [] }} />);

    expect(screen.getByText(/No Radarr, Sonarr or Lidarr is connected/)).toBeInTheDocument();
  });
});
