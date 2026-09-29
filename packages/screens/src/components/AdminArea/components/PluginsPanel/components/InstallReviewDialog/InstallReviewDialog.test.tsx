import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { anInstallPreview } from '@ValenceClient/testing/anInstallPreview';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { InstallReviewDialog } from './InstallReviewDialog';

const installPlugin = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/plugins/installPlugin', () => ({ installPlugin }));

beforeEach(() => {
  installPlugin.mockReset().mockResolvedValue(undefined);
});

describe('InstallReviewDialog', () => {
  it('lists what an official plugin may do and installs it with the fingerprint of what was shown', async () => {
    const onInstalled = vi.fn();

    renderInAnAddress(
      <InstallReviewDialog
        preview={anInstallPreview()}
        onClose={vi.fn()}
        onInstalled={onInstalled}
      />,
    );

    expect(screen.getByText('Official')).toBeInTheDocument();
    expect(screen.getByText('Talk to other websites')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Install' }));

    await waitFor(() => {
      expect(onInstalled).toHaveBeenCalled();
    });

    expect(installPlugin).toHaveBeenCalledWith({
      token: 'token-1',
      acceptedPermissionsHash: 'a'.repeat(64),
      acceptUnsigned: false,
    });
  });

  it('will not install an unsigned plugin until somebody says they understand', async () => {
    renderInAnAddress(
      <InstallReviewDialog
        preview={anInstallPreview({
          trust: 'unsigned',
          warnings: ['It asks to reach more hosts than before.'],
          replacesVersion: '0.9.0',
        })}
        onClose={vi.fn()}
        onInstalled={vi.fn()}
      />,
    );

    expect(screen.getByText('Valence cannot vouch for this plugin')).toBeInTheDocument();
    expect(screen.getByText('It asks to reach more hosts than before.')).toBeInTheDocument();
    expect(screen.getByText(/replaces version 0.9.0/u)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Install anyway' })).toBeDisabled();

    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Install anyway' }));

    await waitFor(() => {
      expect(installPlugin).toHaveBeenCalledWith(expect.objectContaining({ acceptUnsigned: true }));
    });
  });

  it('says when a plugin asks for nothing', () => {
    const preview = anInstallPreview();

    renderInAnAddress(
      <InstallReviewDialog
        preview={{ ...preview, plugin: { ...preview.plugin, permissions: [] } }}
        onClose={vi.fn()}
        onInstalled={vi.fn()}
      />,
    );

    expect(screen.getByText(/Nothing beyond drawing its own pages/u)).toBeInTheDocument();
  });
});
