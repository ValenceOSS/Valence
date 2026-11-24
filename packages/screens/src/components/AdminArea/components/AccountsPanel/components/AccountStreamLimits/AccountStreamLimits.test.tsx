import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { accountStreamLimit } from '@ValenceClient/admin/accountStreamLimit';
import { saveAccountStreamLimit } from '@ValenceClient/admin/saveAccountStreamLimit';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';
import { AccountStreamLimits } from './AccountStreamLimits';

vi.mock('@ValenceClient/admin/accountStreamLimit', () => ({ accountStreamLimit: vi.fn() }));
vi.mock('@ValenceClient/admin/saveAccountStreamLimit', () => ({ saveAccountStreamLimit: vi.fn() }));

const FREE = { maxBitrateKbps: null, maxStreams: null, maxQuality: null, limitsDownloads: false };

const HELD: StreamLimit = {
  maxBitrateKbps: 8000,
  maxStreams: 2,
  maxQuality: '1080p',
  limitsDownloads: true,
};

const UNUSUAL: StreamLimit = {
  maxBitrateKbps: 15_000,
  maxStreams: 7,
  maxQuality: null,
  limitsDownloads: false,
};

beforeEach(() => {
  vi.mocked(accountStreamLimit).mockResolvedValue({ own: FREE, effective: FREE, streamsNow: 1 });
  vi.mocked(saveAccountStreamLimit).mockReset();
});

describe('AccountStreamLimits', () => {
  it('saves the quality, downloads, bitrate in megabits and streams as chosen', async () => {
    vi.mocked(saveAccountStreamLimit).mockResolvedValue({
      own: HELD,
      effective: HELD,
      streamsNow: 1,
    });
    const user = userEvent.setup();

    renderInAnAddress(<AccountStreamLimits accountId="ada" />);

    expect(await screen.findByText('Streaming now: 1')).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Limit downloads too' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Highest quality' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '1080p' }));
    await user.click(screen.getByRole('switch', { name: 'Limit downloads too' }));
    await user.click(screen.getByRole('button', { name: 'Highest bitrate' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '8 Mbps' }));
    await user.click(screen.getByRole('button', { name: 'Streams at once' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '2' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(saveAccountStreamLimit).toHaveBeenCalledWith('ada', {
      maxBitrateKbps: 8000,
      maxStreams: 2,
      maxQuality: '1080p',
      limitsDownloads: true,
    });
    expect(await screen.findByText('Streaming limits saved.')).toBeInTheDocument();
  });

  it('says where its roles hold it to less than its own limit', async () => {
    vi.mocked(accountStreamLimit).mockResolvedValue({
      own: { maxBitrateKbps: 20_000, maxStreams: null, maxQuality: null, limitsDownloads: false },
      effective: { maxBitrateKbps: 4000, maxStreams: 1, maxQuality: null, limitsDownloads: false },
      streamsNow: 0,
    });

    renderInAnAddress(<AccountStreamLimits accountId="ada" />);

    expect(await screen.findByText('Its roles hold it to 4 Mbps.')).toBeInTheDocument();
    expect(screen.getByText('Its roles hold it to 1 at once.')).toBeInTheDocument();
  });

  it('keeps a saved limit that is not one of the usual offered and chosen', async () => {
    vi.mocked(accountStreamLimit).mockResolvedValue({
      own: UNUSUAL,
      effective: UNUSUAL,
      streamsNow: 0,
    });
    const user = userEvent.setup();

    renderInAnAddress(<AccountStreamLimits accountId="ada" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Highest bitrate' })).toHaveTextContent('15 Mbps');
    });
    expect(screen.getByRole('button', { name: 'Streams at once' })).toHaveTextContent('7');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Highest bitrate' }));

    expect(await screen.findByRole('menuitemradio', { name: '15 Mbps' })).toBeChecked();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AccountStreamLimits.displayName).toBe('AccountStreamLimits');
  });
});
