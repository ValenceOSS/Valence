import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { TrustedKeysCard } from './TrustedKeysCard';

const saveTrustedKeys = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/plugins/saveTrustedKeys', () => ({ saveTrustedKeys }));

beforeEach(() => {
  saveTrustedKeys.mockReset().mockResolvedValue([]);
});

const KEYS = [
  { id: 'from-env', publicKey: 'PEM-1', isFromVariable: true },
  { id: 'home-lab', publicKey: 'PEM-2', isFromVariable: false },
];

describe('TrustedKeysCard', () => {
  it('adds a key to the ones saved, leaving the environment’s alone', async () => {
    const onSaved = vi.fn();

    renderInAnAddress(<TrustedKeysCard keys={KEYS} onSaved={onSaved} />);

    expect(screen.getByText('Set by VALENCE_PLUGIN_TRUSTED_KEYS')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trust key' })).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Key id'), 'friends');
    await userEvent.type(screen.getByLabelText('Public key'), 'MCowBQ');
    await userEvent.click(screen.getByRole('button', { name: 'Trust key' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });

    expect(saveTrustedKeys).toHaveBeenCalledWith([
      { id: 'home-lab', publicKey: 'PEM-2' },
      { id: 'friends', publicKey: 'MCowBQ' },
    ]);
  });

  it('forgets a saved key once that is confirmed, and offers no way to forget one the environment sets', async () => {
    renderInAnAddress(<TrustedKeysCard keys={KEYS} onSaved={vi.fn()} />);

    const removes = screen.getAllByRole('button', { name: 'Remove' });

    expect(removes).toHaveLength(1);

    await userEvent.click(removes[0] ?? document.body);

    expect(saveTrustedKeys).not.toHaveBeenCalled();

    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));

    expect(saveTrustedKeys).toHaveBeenCalledWith([]);
  });

  it('shows what the server kept straight away, so a second change before the list rereads keeps the first', async () => {
    saveTrustedKeys.mockResolvedValueOnce([
      ...KEYS,
      { id: 'friends', publicKey: 'PEM-3', isFromVariable: false },
    ]);

    renderInAnAddress(<TrustedKeysCard keys={KEYS} onSaved={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Key id'), 'friends');
    await userEvent.type(screen.getByLabelText('Public key'), 'MCowBQ');
    await userEvent.click(screen.getByRole('button', { name: 'Trust key' }));

    expect(await screen.findByText('friends')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Key id'), 'more');
    await userEvent.type(screen.getByLabelText('Public key'), 'MCowBQ');
    await userEvent.click(screen.getByRole('button', { name: 'Trust key' }));

    expect(saveTrustedKeys).toHaveBeenLastCalledWith([
      { id: 'home-lab', publicKey: 'PEM-2' },
      { id: 'friends', publicKey: 'PEM-3' },
      { id: 'more', publicKey: 'MCowBQ' },
    ]);
  });
});
