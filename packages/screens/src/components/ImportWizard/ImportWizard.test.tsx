import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Answer } from '@ValenceClient/admin/sendToServer';
import type { MediaImportStatus } from '@ValenceContracts/schemas/MediaImport';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { A_REPORT, aMediaImportRun } from './aMediaImportRun';
import { ImportWizard } from './ImportWizard';

const fetchImportStatus = vi.fn<() => Promise<Answer<MediaImportStatus>>>();

vi.mock('@ValenceClient/imports/fetchImportStatus', () => ({
  fetchImportStatus: () => fetchImportStatus(),
}));

vi.mock('@ValenceClient/imports/fetchImportPeople', () => ({
  fetchImportPeople: () =>
    Promise.resolve({
      kind: 'answered',
      value: {
        people: [
          { id: 'u', name: 'Pat', isAdministrator: true, isDisabled: false, access: 'readable' },
        ],
      },
    }),
}));

vi.mock('@ValenceClient/imports/fetchImportLibraries', () => ({
  fetchImportLibraries: () =>
    Promise.resolve({ kind: 'answered', value: { mappings: [], libraries: [] } }),
}));

vi.mock('@ValenceClient/imports/planMediaImport', () => ({
  planMediaImport: () =>
    Promise.resolve({
      kind: 'answered',
      value: aMediaImportRun({ state: 'planned', report: A_REPORT }),
    }),
}));

vi.mock('@ValenceClient/imports/startMediaImport', () => ({
  startMediaImport: () =>
    Promise.resolve({
      kind: 'answered',
      value: aMediaImportRun({ state: 'completed', report: A_REPORT }),
    }),
}));

vi.mock('@ValenceClient/imports/makeImportSetupLinks', () => ({
  makeImportSetupLinks: () =>
    Promise.resolve({ kind: 'answered', value: { canEmail: false, links: [] } }),
}));

vi.mock('@ValenceScreens/components/ImportWizard/components/ArrImportStep/ArrImportStep', () => ({
  ArrImportStep: ({ onSkip }: { onSkip: () => void }) => (
    <div>
      requesting
      <button type="button" onClick={onSkip}>
        skip-arr
      </button>
    </div>
  ),
}));

const DEN = {
  id: 'den',
  kind: 'jellyfin' as const,
  name: 'Den',
  url: 'http://den',
  version: '12.1.0',
  createdAt: '2026-10-02T00:00:00.000Z',
};

beforeEach(() => {
  fetchImportStatus.mockReset().mockResolvedValue({
    kind: 'answered',
    value: { sources: [DEN], runs: [], requests: 'reachable' },
  });
});

describe('ImportWizard', () => {
  it('walks from the server to the dry run, the import, requesting and the links', async () => {
    const onFinished = vi.fn();

    renderInAnAddress(<ImportWizard onFinished={onFinished} />);

    expect(await screen.findByText('Step 1 of 7')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Continue with this server' }));
    expect(screen.getByRole('heading', { name: 'Users to import' })).toBeVisible();

    await userEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: 'Libraries', level: 2 })).toBeVisible();

    await userEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: 'What will be imported' })).toBeVisible();

    await userEvent.click(await screen.findByRole('button', { name: 'Import everything' }));
    expect(await screen.findByText('requesting')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'skip-arr' }));
    expect(screen.getByRole('heading', { name: 'Share setup links' })).toBeVisible();

    await userEvent.click(await screen.findByRole('button', { name: 'Done' }));

    expect(onFinished).toHaveBeenCalledOnce();
    expect(fetchImportStatus).toHaveBeenCalledTimes(2);
  });

  it('goes back a step at a time', async () => {
    renderInAnAddress(<ImportWizard />);

    await userEvent.click(await screen.findByRole('button', { name: 'Continue with this server' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Back' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Back' }));

    expect(
      screen.getByRole('heading', { name: 'Which server are you importing from?' }),
    ).toBeVisible();
  });

  it('goes straight back to an import that is still running', async () => {
    fetchImportStatus.mockResolvedValue({
      kind: 'answered',
      value: {
        sources: [DEN],
        runs: [aMediaImportRun({ sourceId: 'den', state: 'importing' })],
        requests: 'off',
      },
    });
    renderInAnAddress(<ImportWizard />);

    await userEvent.click(await screen.findByRole('button', { name: 'Continue with this server' }));

    expect(screen.getByRole('heading', { name: 'Importing' })).toBeVisible();
  });

  it('says why it could not read what is connected', async () => {
    fetchImportStatus.mockResolvedValue({
      kind: 'refused',
      refusal: { message: 'Only administrators can do that.' },
    });
    renderInAnAddress(<ImportWizard />);

    expect(await screen.findByText(/Only administrators can do that\./)).toBeVisible();
  });
});
