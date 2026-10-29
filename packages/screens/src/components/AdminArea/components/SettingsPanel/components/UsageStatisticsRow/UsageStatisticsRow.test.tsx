import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsageStatisticsRow } from './UsageStatisticsRow';

const saveTelemetryEnabled = vi.hoisted(() =>
  vi.fn<(telemetryEnabled: boolean) => Promise<boolean>>(() => Promise.resolve(true)),
);

const fetchTelemetryPreview = vi.hoisted(() => vi.fn(() => new Promise(() => undefined)));

vi.mock('@ValenceClient/admin/fetchAdmin', () => ({ saveTelemetryEnabled }));

vi.mock('@ValenceClient/admin/fetchTelemetryPreview', () => ({ fetchTelemetryPreview }));

beforeEach(() => {
  saveTelemetryEnabled.mockClear();
  fetchTelemetryPreview.mockClear();
});

describe('UsageStatisticsRow', () => {
  it('turns sharing off and saves it', async () => {
    const user = userEvent.setup();

    render(<UsageStatisticsRow isOn isOffByEnvironment={false} />);

    const sharing = screen.getByRole('switch', { name: 'Share anonymous usage statistics' });

    expect(sharing).toBeChecked();

    await user.click(sharing);

    expect(saveTelemetryEnabled).toHaveBeenCalledWith(false);
    expect(sharing).not.toBeChecked();
  });

  it('turns the switch back where the server would not take it', async () => {
    saveTelemetryEnabled.mockResolvedValueOnce(false);

    const user = userEvent.setup();

    render(<UsageStatisticsRow isOn isOffByEnvironment={false} />);

    const sharing = screen.getByRole('switch', { name: 'Share anonymous usage statistics' });

    await user.click(sharing);

    await waitFor(() => {
      expect(sharing).toBeChecked();
    });
  });

  it('says the environment has turned it off, and offers no choice', () => {
    render(<UsageStatisticsRow isOn isOffByEnvironment />);

    const sharing = screen.getByRole('switch', { name: 'Share anonymous usage statistics' });

    expect(sharing).not.toBeChecked();
    expect(sharing).toBeDisabled();
    expect(screen.getByText(/VALENCE_TELEMETRY or DO_NOT_TRACK/u)).toBeInTheDocument();
  });

  it('opens what is sent', async () => {
    const user = userEvent.setup();

    render(<UsageStatisticsRow isOn isOffByEnvironment={false} />);

    await user.click(screen.getByRole('button', { name: 'See what is sent' }));

    expect(
      await screen.findByRole('dialog', { name: 'What this server sends' }),
    ).toBeInTheDocument();
    expect(fetchTelemetryPreview).toHaveBeenCalledOnce();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(UsageStatisticsRow.displayName).toBe('UsageStatisticsRow');
  });
});
