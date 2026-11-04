import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aLinkedServer } from '@ValenceClient/testing/aLinkedServer';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { LinkedServerPage } from './LinkedServerPage';
import type { Refusal } from '@ValenceClient/admin/readRefusal';

const unlinkServer = vi.fn<(id: string) => Promise<Refusal>>();

vi.mock('@ValenceClient/admin/unlinkServer', () => ({
  unlinkServer: (id: string) => unlinkServer(id),
}));

const SERVER = aLinkedServer({ state: 'linked', name: 'Elsewhere' });

beforeEach(() => {
  unlinkServer.mockReset().mockResolvedValue(null);
});

describe('LinkedServerPage', () => {
  it('shows the server and how the link stands', () => {
    renderInAnAddress(<LinkedServerPage server={SERVER} thisServer="Here" onBack={vi.fn()} />);

    expect(screen.getAllByText('Elsewhere').length).toBeGreaterThan(0);
    expect(screen.getByText('Linked')).toBeInTheDocument();
  });

  it('goes back to every linked server', async () => {
    const onBack = vi.fn();

    renderInAnAddress(<LinkedServerPage server={SERVER} thisServer="Here" onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: 'Back to Linked servers' }));

    expect(onBack).toHaveBeenCalled();
  });

  it('unlinks only once asked', async () => {
    renderInAnAddress(<LinkedServerPage server={SERVER} thisServer="Here" onBack={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Elsewhere' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Unlink' }));

    expect(unlinkServer).not.toHaveBeenCalled();

    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Unlink' }),
    );

    await waitFor(() => {
      expect(unlinkServer).toHaveBeenCalledWith(SERVER.id);
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LinkedServerPage.displayName).toBe('LinkedServerPage');
  });
});
