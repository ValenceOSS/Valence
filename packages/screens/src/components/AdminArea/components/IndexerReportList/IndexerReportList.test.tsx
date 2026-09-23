import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IndexerReportList } from './IndexerReportList';

describe('IndexerReportList', () => {
  it('says what each indexer found, or why it could not answer', () => {
    render(
      <IndexerReportList
        reports={[
          {
            indexerId: '0f8fad5b-d9cb-469f-a165-70867728950e',
            indexerName: 'Jackett',
            found: 12,
            tookMs: 1500,
            problem: null,
            problemCode: null,
          },
          {
            indexerId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
            indexerName: 'Nyaa',
            found: 0,
            tookMs: 30_000,
            problem: 'Timed out',
            problemCode: null,
          },
        ]}
      />,
    );

    expect(screen.getByText('Jackett: 12 in 1.5s')).toBeInTheDocument();
    expect(screen.getByText('Nyaa: Timed out')).toBeInTheDocument();
  });
});
