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

/**
 * Opens the dialog for trusting a key and types one into it.
 *
 * @param id - The key's id.
 * @param publicKey - The key.
 */
const typeAKey = async (id: string, publicKey: string) => {
  await userEvent.click(screen.getByRole('button', { name: 'Add key' }));
  await userEvent.type(await screen.findByLabelText('Key id'), id);
  await userEvent.type(screen.getByLabelText('Public key'), publicKey);
  await userEvent.click(screen.getByRole('button', { name: 'Trust key' }));
};

describe('TrustedKeysCard', () => {
  it('adds a key to the ones saved, leaving the environment’s alone, and closes once it is saved', async () => {
    const onSaved = vi.fn();

    renderInAnAddress(<TrustedKeysCard keys={KEYS} onSaved={onSaved} />);

    expect(screen.getByText('Set by VALENCE_PLUGIN_TRUSTED_KEYS')).toBeInTheDocument();

    await typeAKey('friends', 'MCowBQ');

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });

    expect(saveTrustedKeys).toHaveBeenCalledWith([
      { id: 'home-lab', publicKey: 'PEM-2' },
      { id: 'friends', publicKey: 'MCowBQ' },
    ]);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('says which field is empty rather than saving', async () => {
    renderInAnAddress(<TrustedKeysCard keys={KEYS} onSaved={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add key' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Trust key' }));

    expect(screen.getByText('Give the key its id.')).toBeInTheDocument();
    expect(screen.getByText('Paste the public key.')).toBeInTheDocument();
    expect(saveTrustedKeys).not.toHaveBeenCalled();
  });

  it('stays open with what was typed where the key could not be saved', async () => {
    saveTrustedKeys.mockRejectedValueOnce(new Error('That isn’t a public key.'));

    renderInAnAddress(<TrustedKeysCard keys={KEYS} onSaved={vi.fn()} />);

    await typeAKey('friends', 'nonsense');

    await waitFor(() => {
      expect(saveTrustedKeys).toHaveBeenCalled();
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Key id')).toHaveValue('friends');
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

    await typeAKey('friends', 'MCowBQ');

    expect(await screen.findByText('friends')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await typeAKey('more', 'MCowBQ');

    expect(saveTrustedKeys).toHaveBeenLastCalledWith([
      { id: 'home-lab', publicKey: 'PEM-2' },
      { id: 'friends', publicKey: 'PEM-3' },
      { id: 'more', publicKey: 'MCowBQ' },
    ]);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TrustedKeysCard.displayName).toBe('TrustedKeysCard');
  });
});
