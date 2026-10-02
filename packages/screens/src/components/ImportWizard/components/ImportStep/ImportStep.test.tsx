import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Answer } from '@ValenceClient/admin/sendToServer';
import type { MediaImportRun } from '@ValenceContracts/schemas/MediaImport';
import { aMediaImportRun } from '@ValenceScreens/components/ImportWizard/aMediaImportRun';
import { ImportStep } from './ImportStep';

const fetchImportRun = vi.fn<(runId: string) => Promise<Answer<MediaImportRun>>>();
const startMediaImport = vi.fn<(runId: string) => Promise<Answer<MediaImportRun>>>();
const cancelMediaImport = vi.fn<(runId: string) => Promise<Answer<MediaImportRun>>>();

vi.mock('@ValenceClient/imports/fetchImportRun', () => ({
  fetchImportRun: (runId: string) => fetchImportRun(runId),
}));

vi.mock('@ValenceClient/imports/startMediaImport', () => ({
  startMediaImport: (runId: string) => startMediaImport(runId),
}));

vi.mock('@ValenceClient/imports/cancelMediaImport', () => ({
  cancelMediaImport: (runId: string) => cancelMediaImport(runId),
}));

beforeEach(() => {
  fetchImportRun.mockReset();
  startMediaImport.mockReset();
  cancelMediaImport.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ImportStep', () => {
  it('follows the import until it is done, then hands it on', async () => {
    vi.useFakeTimers();

    const done = aMediaImportRun({ state: 'completed' });
    const onFinished = vi.fn();

    fetchImportRun.mockResolvedValue({ kind: 'answered', value: done });
    render(
      <ImportStep started={aMediaImportRun({ state: 'importing' })} onFinished={onFinished} />,
    );

    expect(screen.getByLabelText('Getting ready')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(onFinished).toHaveBeenCalledWith(done);
  });

  it('can be stopped, and carried on from where it stopped', async () => {
    const stopped = aMediaImportRun({ state: 'cancelled' });

    cancelMediaImport.mockResolvedValue({ kind: 'answered', value: stopped });
    startMediaImport.mockResolvedValue({
      kind: 'answered',
      value: aMediaImportRun({ state: 'importing' }),
    });
    fetchImportRun.mockResolvedValue({
      kind: 'answered',
      value: aMediaImportRun({ state: 'importing' }),
    });
    render(<ImportStep started={aMediaImportRun({ state: 'importing' })} onFinished={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));

    expect(await screen.findByText('The import stopped.')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Carry on' }));

    expect(startMediaImport).toHaveBeenCalledWith('run');
    expect(await screen.findByRole('button', { name: 'Stop' })).toBeVisible();
  });

  it('says why an import failed', () => {
    render(
      <ImportStep
        started={aMediaImportRun({
          state: 'failed',
          failure: { code: null, message: 'Den went away.', values: {} },
        })}
        onFinished={vi.fn()}
      />,
    );

    expect(screen.getByText('Den went away.')).toBeVisible();
  });
});
