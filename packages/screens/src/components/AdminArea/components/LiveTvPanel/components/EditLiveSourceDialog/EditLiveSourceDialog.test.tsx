import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditLiveSourceDialog } from '@ValenceScreens/components/AdminArea/components/LiveTvPanel/components/EditLiveSourceDialog/EditLiveSourceDialog';
import type { LiveSource } from '@ValenceContracts/schemas/LiveTv';

const changeLiveSource = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/live/changeLiveSource', () => ({ changeLiveSource }));

const SOURCE: LiveSource = {
  id: '6b1f0000-0000-4000-8000-000000000001',
  name: 'Aerial',
  kind: 'tuner',
  address: 'http://192.168.1.20',
  guideUrl: null,
  logoUrl: null,
  hasPicture: false,
  channelCount: 12,
  refreshedAt: null,
  problem: null,
};

const PLAYLIST_FILE: LiveSource = { ...SOURCE, kind: 'playlistFile', address: null };

const drawn = (source: LiveSource) => {
  const onClose = vi.fn();
  const onChanged = vi.fn();

  render(<EditLiveSourceDialog source={source} onClose={onClose} onChanged={onChanged} />);

  return { onClose, onChanged };
};

describe('EditLiveSourceDialog', () => {
  beforeEach(() => {
    changeLiveSource.mockReset();
  });

  it('labels the address by what the source reads', () => {
    drawn(SOURCE);

    expect(screen.getByRole('textbox', { name: 'Tuner address' })).toHaveValue(
      'http://192.168.1.20',
    );
  });

  it('sends only the name when only the name changes', async () => {
    changeLiveSource.mockResolvedValue({
      value: { ...SOURCE, name: 'Loft aerial' },
      refusal: null,
    });
    const { onChanged, onClose } = drawn(SOURCE);

    await userEvent.clear(screen.getByRole('textbox', { name: 'Name' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Loft aerial');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalled();
    });
    expect(changeLiveSource).toHaveBeenCalledWith(SOURCE.id, { name: 'Loft aerial' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes without sending when nothing changed', async () => {
    const { onClose } = drawn(SOURCE);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(changeLiveSource).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('asks for an address rather than clearing it', async () => {
    drawn(SOURCE);

    await userEvent.clear(screen.getByRole('textbox', { name: 'Tuner address' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Give it an address.');
    expect(changeLiveSource).not.toHaveBeenCalled();
  });

  it('says why the server refused', async () => {
    changeLiveSource.mockResolvedValue({ value: null, refusal: { message: 'No such tuner.' } });
    const { onChanged } = drawn(SOURCE);

    await userEvent.type(screen.getByRole('textbox', { name: 'Tuner address' }), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No such tuner.');
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('offers a new file instead of an address for an uploaded playlist', () => {
    drawn(PLAYLIST_FILE);

    expect(screen.queryByRole('textbox', { name: /address/ })).not.toBeInTheDocument();
    expect(screen.getByText('Its channels are read again from the new file.')).toBeInTheDocument();
  });
});
