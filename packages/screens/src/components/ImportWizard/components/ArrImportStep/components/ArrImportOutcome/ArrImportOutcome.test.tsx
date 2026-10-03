import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { ArrImportApplied, ArrWanted } from '@ValenceContracts/schemas/ArrImport';
import { ArrImportOutcome } from './ArrImportOutcome';

const A_WANTED: ArrWanted = {
  key: 'film:603',
  kind: 'film',
  tmdbId: 603,
  tvdbId: null,
  musicBrainzId: null,
  title: 'The Matrix',
  seasons: null,
  libraryId: null,
  profileId: null,
  isApproved: true,
  requester: null,
};

const APPLIED: ArrImportApplied = {
  clients: { added: 2, kept: 1 },
  indexers: { added: 1, kept: 0 },
  profiles: { added: 3, kept: 0 },
  apps: { added: 1, kept: 1 },
  prowlarr: { added: 4, updated: 0, removed: 0, unchanged: 2 },
  libraries: [],
  wanted: [A_WANTED, { ...A_WANTED, key: 'film:604' }],
  problems: [sayVerbatim('Couldn’t read Lidarr: it didn’t respond')],
};

describe('ArrImportOutcome', () => {
  it('says what was added and kept, how far asking has got, and what could not be done', () => {
    render(
      <ArrImportOutcome
        applied={APPLIED}
        asked={{
          done: 2,
          made: 1,
          already: 0,
          failed: [{ key: 'film:604', title: '', problem: sayVerbatim('Not known') }],
        }}
        isAsking={false}
      />,
    );

    expect(screen.getByText('Download clients: 2 added, 1 already in Valence')).toBeInTheDocument();
    expect(screen.getByText('Indexers: 5 added, 2 already in Valence')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('1 request made, 0 already requested')).toBeInTheDocument();
    expect(screen.getByText('Couldn’t read Lidarr: it didn’t respond')).toBeInTheDocument();
    expect(screen.getByText('film:604: Not known')).toBeInTheDocument();
  });

  it('says nothing of requests while they are still being asked for', () => {
    render(
      <ArrImportOutcome
        applied={{ ...APPLIED, problems: [] }}
        asked={{ done: 0, made: 0, already: 0, failed: [] }}
        isAsking
      />,
    );

    expect(screen.queryByText(/request made/)).not.toBeInTheDocument();
  });
});
