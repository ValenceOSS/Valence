import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import type {
  ArrImportApplied,
  ArrImportAsk,
  ArrImportPlan,
  ArrWanted,
  ArrWantedOutcome,
} from '@ValenceContracts/schemas/ArrImport';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import { ArrImportStep } from './ArrImportStep';

const fetchRequestsAvailability = vi.fn<() => Promise<{ isEnabled: boolean }>>();
const planArrImport = vi.fn<(ask: ArrImportAsk) => Promise<Sent<ArrImportPlan>>>();
const applyArrImport = vi.fn<(ask: ArrImportAsk) => Promise<Sent<ArrImportApplied>>>();
const askForArrWanted = vi.fn<(items: readonly ArrWanted[]) => Promise<Sent<ArrWantedOutcome>>>();

vi.mock('@ValenceClient/requests/fetchRequests', () => ({
  fetchRequestsAvailability: () => fetchRequestsAvailability(),
  fetchRequestsOverview: vi.fn(),
  checkRequestsNow: vi.fn(),
}));

vi.mock('@ValenceClient/requests/planArrImport', () => ({
  planArrImport: (ask: ArrImportAsk) => planArrImport(ask),
}));

vi.mock('@ValenceClient/requests/applyArrImport', () => ({
  applyArrImport: (ask: ArrImportAsk) => applyArrImport(ask),
}));

vi.mock('@ValenceClient/requests/askForArrWanted', () => ({
  askForArrWanted: (items: readonly ArrWanted[]) => askForArrWanted(items),
}));

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
  ],
  clients: [],
  indexers: [],
  prowlarr: null,
  profiles: [],
  libraries: [
    {
      libraryId: 'films',
      libraryName: 'Films',
      libraryKind: 'movies',
      appName: 'Radarr',
      appUrl: 'http://radarr:7878',
      rootFolders: ['/movies'],
      isGuessed: false,
      profileName: null,
    },
  ],
  unplacedFolders: [],
  wanted: { films: 26, series: 0, artists: 0, requests: 0, unaskable: 0 },
  secrets: [{ key: 'client:q:password', field: 'password', item: 'qBittorrent', from: ['Radarr'] }],
};

const APPLIED: ArrImportApplied = {
  clients: { added: 1, kept: 0 },
  indexers: { added: 0, kept: 0 },
  profiles: { added: 0, kept: 0 },
  apps: { added: 1, kept: 0 },
  prowlarr: null,
  libraries: [],
  wanted: Array.from({ length: 26 }, (_, index) => ({
    ...A_WANTED,
    key: `film:${index.toString()}`,
  })),
  problems: [],
};

beforeEach(() => {
  fetchRequestsAvailability.mockReset().mockResolvedValue({ isEnabled: true });
  planArrImport.mockReset().mockResolvedValue({ value: PLAN, refusal: null });
  applyArrImport.mockReset().mockResolvedValue({ value: APPLIED, refusal: null });
  askForArrWanted
    .mockReset()
    .mockImplementation((items) =>
      Promise.resolve({ value: { made: items.length, already: 0, failed: [] }, refusal: null }),
    );
});

describe('ArrImportStep', () => {
  it('says how to switch requesting on where it is off, and lets the admin skip', async () => {
    const onSkip = vi.fn();

    fetchRequestsAvailability.mockResolvedValue({ isEnabled: false });
    renderInAnAddress(<ArrImportStep onSkip={onSkip} />);

    expect(await screen.findByText('Requests aren’t enabled')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'How to enable requests' })).toHaveAttribute(
      'href',
      'https://docs.getvalence.app/install/requesting#switching-it-on',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Skip this' }));

    expect(onSkip).toHaveBeenCalled();
  });

  it('says what is missing before reading anything', async () => {
    renderInAnAddress(<ArrImportStep />);

    await userEvent.click(await screen.findByRole('button', { name: 'Check setup' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter at least one app’s address and API key.',
    );
    expect(planArrImport).not.toHaveBeenCalled();
  });

  it('reads the setup, takes masked secrets and choices, brings it in and asks for what was waited for', async () => {
    const onDone = vi.fn();

    renderInAnAddress(
      <ArrImportStep pathMappings={[{ from: '/movies', to: '/media/Films' }]} onDone={onDone} />,
    );

    await userEvent.type(
      await screen.findByLabelText('Overseerr address'),
      'http://overseerr:5055',
    );
    await userEvent.type(screen.getByLabelText('Overseerr API key'), 'key');
    await userEvent.click(screen.getByRole('button', { name: 'Check setup' }));

    expect(planArrImport).toHaveBeenCalledWith({
      sources: [{ kind: 'overseerr', url: 'http://overseerr:5055', apiKey: 'key' }],
      pathMappings: [{ from: '/movies', to: '/media/Films' }],
      secrets: {},
      choices: {},
    });

    await userEvent.type(await screen.findByLabelText('Password for qBittorrent'), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Valence downloads' }));
    await userEvent.click(screen.getByRole('button', { name: 'Import it' }));

    await waitFor(() => {
      expect(askForArrWanted).toHaveBeenCalledTimes(2);
    });
    expect(applyArrImport).toHaveBeenCalledWith(
      expect.objectContaining({
        secrets: { 'client:q:password': 'pw' },
        choices: { films: 'takeOver' },
      }),
    );
    expect(await screen.findByText('26 requests made, 0 already requested')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(onDone).toHaveBeenCalledWith(APPLIED);
  });

  it('says why a plan was refused', async () => {
    planArrImport.mockResolvedValue({
      value: null,
      refusal: { message: 'Requests are turned off.' },
    });
    renderInAnAddress(<ArrImportStep />);

    await userEvent.type(await screen.findByLabelText('Radarr address'), 'http://radarr:7878');
    await userEvent.type(screen.getByLabelText('Radarr API key'), 'key');
    await userEvent.click(screen.getByRole('button', { name: 'Check setup' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Requests are turned off.');
  });
});
