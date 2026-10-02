import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Answer } from '@ValenceClient/admin/sendToServer';
import type { MediaImportRun, PlanMediaImport } from '@ValenceContracts/schemas/MediaImport';
import { A_REPORT, aMediaImportRun } from '@ValenceScreens/components/ImportWizard/aMediaImportRun';
import { PlanStep } from './PlanStep';

const planMediaImport =
  vi.fn<(sourceId: string, asked: PlanMediaImport) => Promise<Answer<MediaImportRun>>>();
const startMediaImport = vi.fn<(runId: string) => Promise<Answer<MediaImportRun>>>();
const cancelMediaImport = vi.fn<(runId: string) => Promise<Answer<MediaImportRun>>>();

vi.mock('@ValenceClient/imports/planMediaImport', () => ({
  planMediaImport: (sourceId: string, asked: PlanMediaImport) => planMediaImport(sourceId, asked),
}));

vi.mock('@ValenceClient/imports/startMediaImport', () => ({
  startMediaImport: (runId: string) => startMediaImport(runId),
}));

vi.mock('@ValenceClient/imports/cancelMediaImport', () => ({
  cancelMediaImport: (runId: string) => cancelMediaImport(runId),
}));

vi.mock('@ValenceClient/imports/fetchImportRun', () => ({
  fetchImportRun: () => Promise.resolve({ kind: 'refused', refusal: null }),
}));

const SOURCE = {
  id: 'den',
  kind: 'jellyfin' as const,
  name: 'Den',
  url: 'http://den',
  version: '12.1.0',
  createdAt: '2026-10-02T00:00:00.000Z',
};

const CHOICE = { skipUserIds: ['u-old'], meUserId: 'u-pat' };

beforeEach(() => {
  planMediaImport.mockReset();
  startMediaImport.mockReset();
  cancelMediaImport.mockReset();
});

describe('PlanStep', () => {
  it('runs the dry run for who was chosen, shows its report and starts the import', async () => {
    const onStarted = vi.fn();
    const importing = aMediaImportRun({ state: 'importing' });

    planMediaImport.mockResolvedValue({
      kind: 'answered',
      value: aMediaImportRun({ state: 'planned', report: A_REPORT }),
    });
    startMediaImport.mockResolvedValue({ kind: 'answered', value: importing });
    render(<PlanStep source={SOURCE} choice={CHOICE} onStarted={onStarted} onBack={vi.fn()} />);

    expect(await screen.findByText(/Nothing has been written yet/)).toBeVisible();
    expect(planMediaImport).toHaveBeenCalledWith('den', CHOICE);

    await userEvent.click(screen.getByRole('button', { name: 'Import everything' }));

    expect(onStarted).toHaveBeenCalledWith(importing);
  });

  it('follows the dry run while it reads, and can stop it', async () => {
    planMediaImport.mockResolvedValue({ kind: 'answered', value: aMediaImportRun() });
    cancelMediaImport.mockResolvedValue({
      kind: 'answered',
      value: aMediaImportRun({ state: 'cancelled' }),
    });
    render(<PlanStep source={SOURCE} choice={CHOICE} onStarted={vi.fn()} onBack={vi.fn()} />);

    expect(await screen.findByText('Reading everything on Den and writing nothing.')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));

    expect(await screen.findByText('The dry run stopped.')).toBeVisible();

    planMediaImport.mockResolvedValue({
      kind: 'answered',
      value: aMediaImportRun({ state: 'planned', report: A_REPORT }),
    });
    await userEvent.click(screen.getByRole('button', { name: 'Plan again' }));

    expect(await screen.findByText(/Nothing has been written yet/)).toBeVisible();
  });

  it('says why a dry run failed, and why one could not start', async () => {
    const onBack = vi.fn();

    planMediaImport.mockResolvedValueOnce({
      kind: 'answered',
      value: aMediaImportRun({
        state: 'failed',
        failure: { code: null, message: 'Den refused the key.', values: {} },
      }),
    });
    render(<PlanStep source={SOURCE} choice={CHOICE} onStarted={vi.fn()} onBack={onBack} />);

    expect(await screen.findByText('Den refused the key.')).toBeVisible();

    planMediaImport.mockResolvedValueOnce({
      kind: 'refused',
      refusal: { message: 'No such server.' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Plan again' }));

    expect(await screen.findByText('No such server.')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('says why the import could not start', async () => {
    planMediaImport.mockResolvedValue({
      kind: 'answered',
      value: aMediaImportRun({ state: 'planned', report: A_REPORT }),
    });
    startMediaImport.mockResolvedValue({ kind: 'refused', refusal: null });
    render(<PlanStep source={SOURCE} choice={CHOICE} onStarted={vi.fn()} onBack={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Import everything' }));

    await waitFor(() => {
      expect(screen.getByText('That could not be done.')).toBeVisible();
    });
  });
});
