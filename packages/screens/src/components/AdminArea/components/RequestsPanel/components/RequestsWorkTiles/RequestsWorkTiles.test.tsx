import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NO_WORK } from '@ValenceContracts/schemas/Requests';
import { RequestsWorkTiles } from './RequestsWorkTiles';

describe('RequestsWorkTiles', () => {
  it('says what is waiting, coming down, stuck and arrived, and how fast it all comes', () => {
    render(
      <RequestsWorkTiles
        work={{
          ...NO_WORK,
          awaitingApproval: 2,
          downloading: 3,
          failed: 1,
          arrivedToday: 4,
          downloadBytesPerSecond: 12 * 1024 * 1024,
          clients: { total: 2, reachable: 2, failing: [] },
        }}
      />,
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('12 MB/s between them.')).toBeInTheDocument();
    expect(screen.getByText('2 of 2 download clients answering.')).toBeInTheDocument();
  });

  it('names a download client that is not answering beside what is stuck', () => {
    render(
      <RequestsWorkTiles
        work={{
          ...NO_WORK,
          clients: { total: 1, reachable: 0, failing: [{ name: 'qBittorrent', problem: 'No' }] },
        }}
      />,
    );

    expect(screen.getByText('qBittorrent not answering.')).toBeInTheDocument();
  });

  it('says there is nothing doing when there is nothing doing', () => {
    render(<RequestsWorkTiles work={NO_WORK} />);

    expect(screen.getByText('Nothing to answer.')).toBeInTheDocument();
    expect(screen.getByText('Nothing is being fetched.')).toBeInTheDocument();
    expect(screen.getByText('Nothing has failed.')).toBeInTheDocument();
  });
});
