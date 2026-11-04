import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TelemetryPreview } from '@ValenceContracts/schemas/TelemetryPreview';
import { TelemetryPreviewDialog } from './TelemetryPreviewDialog';

const ID = '7c1f6a2e-4b1d-4c39-9a57-0e2f5b8d9c41';

const ANOTHER_ID = '0f9e8d7c-6b5a-4c3d-8e1f-a2b3c4d5e6f7';

/**
 * A preview as the server answers it.
 *
 * @param changes - What differs from a report being sent.
 * @param installId - The install id the report carries.
 * @returns The preview.
 */
const aPreview = (changes: Partial<TelemetryPreview> = {}, installId = ID): TelemetryPreview => ({
  isSending: true,
  heldOffBy: null,
  address: 'https://metrics.getvalence.app/api/v1/reports',
  report: {
    schemaVersion: 1,
    installId,
    version: '1.8.0',
    installMethod: 'docker',
    os: { platform: 'linux', release: '6.8.0', arch: 'x64' },
    cpu: { model: 'AMD Ryzen 7 9800X3D', cores: 16 },
    memoryGb: '32-64',
    gpus: [{ vendor: 'nvidia', model: 'GeForce RTX 5080' }],
    accels: ['nvenc'],
    database: 'postgres',
    library: { films: '100-999', episodes: '0', tracks: '0', books: '0' },
    clients: { browser: '1-9' },
  },
  ...changes,
});

const fetchTelemetryPreview = vi.hoisted(() => vi.fn<() => Promise<TelemetryPreview>>());

const resetTelemetryInstallId = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      kind: 'answered' as const,
      value: { installId: '0f9e8d7c-6b5a-4c3d-8e1f-a2b3c4d5e6f7' },
    }),
  ),
);

vi.mock('@ValenceClient/admin/fetchTelemetryPreview', () => ({ fetchTelemetryPreview }));

vi.mock('@ValenceClient/admin/resetTelemetryInstallId', () => ({ resetTelemetryInstallId }));

beforeEach(() => {
  fetchTelemetryPreview.mockReset().mockResolvedValue(aPreview());
  resetTelemetryInstallId.mockClear();
});

describe('TelemetryPreviewDialog', () => {
  it('shows the whole report as it would be sent', async () => {
    render(<TelemetryPreviewDialog isOpen onClose={vi.fn()} />);

    const report = await screen.findByLabelText('The anonymous report');

    expect(report).toHaveTextContent('"installId": "7c1f6a2e-4b1d-4c39-9a57-0e2f5b8d9c41"');
    expect(report).toHaveTextContent('"model": "GeForce RTX 5080"');
    expect(screen.getByRole('link', { name: 'What is sent, and why' })).toHaveAttribute(
      'href',
      'https://docs.getvalence.app/use/telemetry',
    );
  });

  it('says why nothing is sent where sharing is off', async () => {
    fetchTelemetryPreview.mockResolvedValue(aPreview({ isSending: false, heldOffBy: 'setting' }));

    render(<TelemetryPreviewDialog isOpen onClose={vi.fn()} />);

    expect(
      await screen.findByText('Sharing is turned off, so nothing is sent.'),
    ).toBeInTheDocument();
  });

  it('makes a new install id and shows the report carrying it', async () => {
    const user = userEvent.setup();

    render(<TelemetryPreviewDialog isOpen onClose={vi.fn()} />);

    await screen.findByLabelText('The anonymous report');
    fetchTelemetryPreview.mockResolvedValue(aPreview({}, ANOTHER_ID));

    await user.click(screen.getByRole('button', { name: 'Make a new install ID' }));

    expect(resetTelemetryInstallId).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.getByLabelText('The anonymous report')).toHaveTextContent(ANOTHER_ID);
    });
  });

  it('says the report could not be read', async () => {
    fetchTelemetryPreview.mockRejectedValue(new Error('403'));

    render(<TelemetryPreviewDialog isOpen onClose={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('The report could not be read.');
  });

  it('reads nothing while closed', () => {
    render(<TelemetryPreviewDialog isOpen={false} onClose={vi.fn()} />);

    expect(fetchTelemetryPreview).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TelemetryPreviewDialog.displayName).toBe('TelemetryPreviewDialog');
  });
});
