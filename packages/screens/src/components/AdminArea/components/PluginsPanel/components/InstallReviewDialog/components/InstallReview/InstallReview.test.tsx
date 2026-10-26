import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { anInstallPreview } from '@ValenceClient/testing/anInstallPreview';
import { InstallReview } from './InstallReview';

/**
 * Draws the review with nothing ticked and nothing being installed.
 *
 * @param preview - What the server said installing would mean.
 * @returns What it was told.
 */
const draw = (preview = anInstallPreview()) => {
  const told = { onUnderstood: vi.fn(), onCancel: vi.fn(), onInstall: vi.fn() };

  render(<InstallReview preview={preview} isUnderstood={false} isInstalling={false} {...told} />);

  return told;
};

describe('InstallReview', () => {
  it('names the plugin and who vouches for it', () => {
    draw();

    expect(screen.getByText('Official')).toBeInTheDocument();
  });

  it('installs an official plugin when asked', async () => {
    const { onInstall } = draw();

    await userEvent.click(screen.getByRole('button', { name: 'Install' }));

    expect(onInstall).toHaveBeenCalledOnce();
  });

  it('thinks again when asked', async () => {
    const { onCancel } = draw();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('holds an unsigned plugin back until its risk is accepted', async () => {
    const { onUnderstood } = draw(anInstallPreview({ trust: 'unsigned' }));

    expect(screen.getByRole('button', { name: 'Install anyway' })).toBeDisabled();

    await userEvent.click(
      screen.getByLabelText('I understand this plugin isn’t signed, and I trust its source'),
    );

    expect(onUnderstood).toHaveBeenCalledWith(true);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(InstallReview.displayName).toBe('InstallReview');
  });
});
