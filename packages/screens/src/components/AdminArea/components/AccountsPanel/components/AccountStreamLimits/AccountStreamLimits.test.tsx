import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { accountStreamLimit } from '@ValenceClient/admin/accountStreamLimit';
import { saveAccountStreamLimit } from '@ValenceClient/admin/saveAccountStreamLimit';
import { AccountStreamLimits } from './AccountStreamLimits';

vi.mock('@ValenceClient/admin/accountStreamLimit', () => ({ accountStreamLimit: vi.fn() }));
vi.mock('@ValenceClient/admin/saveAccountStreamLimit', () => ({ saveAccountStreamLimit: vi.fn() }));

const FREE = { maxBitrateKbps: null, maxStreams: null };

beforeEach(() => {
  vi.mocked(accountStreamLimit).mockResolvedValue({ own: FREE, effective: FREE, streamsNow: 1 });
  vi.mocked(saveAccountStreamLimit).mockReset();
});

describe('AccountStreamLimits', () => {
  it('saves the bitrate in megabits and the streams as typed', async () => {
    vi.mocked(saveAccountStreamLimit).mockResolvedValue({
      own: { maxBitrateKbps: 8000, maxStreams: 2 },
      effective: { maxBitrateKbps: 8000, maxStreams: 2 },
      streamsNow: 1,
    });
    const user = userEvent.setup();

    renderInAnAddress(<AccountStreamLimits accountId="ada" />);

    expect(await screen.findByText('Streaming now: 1')).toBeInTheDocument();

    await user.type(screen.getByRole('spinbutton', { name: /Highest bitrate/ }), '8');
    await user.type(screen.getByRole('spinbutton', { name: /Streams at once/ }), '2');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(saveAccountStreamLimit).toHaveBeenCalledWith('ada', {
      maxBitrateKbps: 8000,
      maxStreams: 2,
    });
    expect(await screen.findByText('Streaming limits saved.')).toBeInTheDocument();
  });

  it('says where its roles hold it to less than its own limit', async () => {
    vi.mocked(accountStreamLimit).mockResolvedValue({
      own: { maxBitrateKbps: 20_000, maxStreams: null },
      effective: { maxBitrateKbps: 4000, maxStreams: 1 },
      streamsNow: 0,
    });

    renderInAnAddress(<AccountStreamLimits accountId="ada" />);

    expect(await screen.findByText('Its roles hold it to 4 Mbps.')).toBeInTheDocument();
    expect(screen.getByText('Its roles hold it to 1 at once.')).toBeInTheDocument();
  });

  it('will not save something that is not a limit', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountStreamLimits accountId="ada" />);

    await waitFor(() => {
      expect(accountStreamLimit).toHaveBeenCalled();
    });

    await user.type(screen.getByRole('spinbutton', { name: /Streams at once/ }), '0');

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AccountStreamLimits.displayName).toBe('AccountStreamLimits');
  });
});
