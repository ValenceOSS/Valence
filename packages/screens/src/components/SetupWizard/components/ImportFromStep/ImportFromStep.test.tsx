import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ImportFromStep } from './ImportFromStep';
import type { ImportWizardProps } from '@ValenceScreens/components/ImportWizard/ImportWizard.types';

vi.mock('@ValenceScreens/components/ImportWizard/ImportWizard', () => ({
  ImportWizard: ({ onFinished }: ImportWizardProps) => (
    <button type="button" onClick={onFinished}>
      Finish the import
    </button>
  ),
}));

vi.mock('@ValenceScreens/components/ImportWizard/components/ArrImportStep/ArrImportStep', () => ({
  ArrImportStep: ({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) => (
    <>
      <button type="button" onClick={onDone}>
        Connect the apps
      </button>
      <button type="button" onClick={onSkip}>
        Skip the apps
      </button>
    </>
  ),
}));

describe('ImportFromStep', () => {
  it('starts fresh unless told otherwise', async () => {
    const onDone = vi.fn();

    render(<ImportFromStep onBack={vi.fn()} onDone={onDone} />);

    expect(screen.getByRole('radio', { name: /Start fresh/ })).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: 'Start fresh' }));

    expect(onDone).toHaveBeenCalledWith('fresh');
  });

  it('goes back a step', async () => {
    const onBack = vi.fn();

    render(<ImportFromStep onBack={onBack} onDone={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('brings a Jellyfin, Emby or Plex server across, then says so', async () => {
    const onDone = vi.fn();

    render(<ImportFromStep onBack={vi.fn()} onDone={onDone} />);

    await userEvent.click(screen.getByRole('radio', { name: /From Jellyfin, Emby or Plex/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      screen.getByRole('heading', { name: 'From Jellyfin, Emby or Plex' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish the import' }));

    expect(onDone).toHaveBeenCalledWith('server');
  });

  it('can choose again, or finish without importing, from the server import', async () => {
    const onDone = vi.fn();

    render(<ImportFromStep onBack={vi.fn()} onDone={onDone} />);

    await userEvent.click(screen.getByRole('radio', { name: /From Jellyfin, Emby or Plex/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(screen.getByRole('button', { name: 'Choose again' }));

    expect(screen.getByRole('radiogroup', { name: 'Import from another server' })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish without importing' }));

    expect(onDone).toHaveBeenCalledWith('fresh');
  });

  it('connects only the requesting apps, then says so', async () => {
    const onDone = vi.fn();

    render(<ImportFromStep onBack={vi.fn()} onDone={onDone} />);

    await userEvent.click(screen.getByRole('radio', { name: /Import only my requesting apps/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('heading', { name: 'Your requesting apps' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Connect the apps' }));

    expect(onDone).toHaveBeenCalledWith('requests');
  });

  it('goes back to the choice when the requesting apps are skipped', async () => {
    render(<ImportFromStep onBack={vi.fn()} onDone={vi.fn()} />);

    await userEvent.click(screen.getByRole('radio', { name: /Import only my requesting apps/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(screen.getByRole('button', { name: 'Skip the apps' }));

    expect(screen.getByRole('radio', { name: /Import only my requesting apps/ })).toBeChecked();
  });

  it('can change its mind back to starting fresh', async () => {
    const onDone = vi.fn();

    render(<ImportFromStep onBack={vi.fn()} onDone={onDone} />);

    await userEvent.click(screen.getByRole('radio', { name: /From Jellyfin, Emby or Plex/ }));
    await userEvent.click(screen.getByRole('radio', { name: /Start fresh/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Start fresh' }));

    expect(onDone).toHaveBeenCalledWith('fresh');
  });
});
