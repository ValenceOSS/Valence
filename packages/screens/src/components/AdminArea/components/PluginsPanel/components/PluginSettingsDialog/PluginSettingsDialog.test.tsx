import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aPlugin } from '@ValenceClient/testing/aPlugin';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PluginSettingsDialog } from './PluginSettingsDialog';

const changePlugin = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/plugins/changePlugin', () => ({ changePlugin }));

beforeEach(() => {
  changePlugin.mockReset().mockResolvedValue(undefined);
});

describe('PluginSettingsDialog', () => {
  it('never shows a saved secret, and keeps it unless something new is typed', async () => {
    const onSaved = vi.fn();

    renderInAnAddress(
      <PluginSettingsDialog plugin={aPlugin()} onClose={vi.fn()} onSaved={onSaved} />,
    );

    expect(screen.getByLabelText('Client secret')).toHaveValue('');
    expect(screen.getByPlaceholderText('Saved. Type to replace it.')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Client id'));
    await userEvent.type(screen.getByLabelText('Client id'), 'new-id');
    await userEvent.click(screen.getByRole('switch', { name: 'Send progress' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });

    expect(changePlugin).toHaveBeenCalledWith('anilist', {
      settings: { clientId: 'new-id', pushProgress: false },
    });
  });

  it('sends a secret somebody typed', async () => {
    renderInAnAddress(
      <PluginSettingsDialog plugin={aPlugin()} onClose={vi.fn()} onSaved={vi.fn()} />,
    );

    await userEvent.type(screen.getByLabelText('Client secret'), 's3cret');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changePlugin).toHaveBeenCalledWith('anilist', {
        settings: { clientId: 'abc', clientSecret: 's3cret', pushProgress: true },
      });
    });
  });
});
