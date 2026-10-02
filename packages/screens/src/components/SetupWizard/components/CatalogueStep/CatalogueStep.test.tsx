import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { CatalogueStep } from './CatalogueStep';
import type * as FetchAdmin from '@ValenceClient/admin/fetchAdmin';
import type { CatalogueStepProps } from './CatalogueStep.types';

const fetchAdminOverview = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ settings: { hasCatalogueKey: false } })),
);
const saveCatalogueKey = vi.hoisted(() => vi.fn<(key: string) => Promise<boolean>>());

vi.mock('@ValenceClient/admin/fetchAdmin', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchAdmin>()),
  fetchAdminOverview,
  saveCatalogueKey,
}));

const renderStep = (props: Partial<CatalogueStepProps> = {}) =>
  render(<CatalogueStep onBack={vi.fn()} onSaved={vi.fn()} onSkip={vi.fn()} {...props} />, {
    wrapper: CacheScope,
  });

beforeEach(() => {
  fetchAdminOverview.mockReset().mockResolvedValue({ settings: { hasCatalogueKey: false } });
  saveCatalogueKey.mockReset().mockResolvedValue(true);
});

describe('CatalogueStep', () => {
  it('checks for a key before asking for one', () => {
    renderStep();

    expect(screen.getByRole('status', { name: 'Checking for a key' })).toBeInTheDocument();
  });

  it('asks for a key, and says where a free one comes from', async () => {
    renderStep();

    expect(await screen.findByLabelText('Catalogue key')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get a free key' })).toHaveAttribute(
      'href',
      'https://www.themoviedb.org/settings/api',
    );
  });

  it('cannot save an empty key', async () => {
    renderStep();

    await screen.findByLabelText('Catalogue key');

    expect(screen.getByRole('button', { name: 'Save and continue' })).toBeDisabled();
  });

  it('saves the key without spaces around it, then goes on', async () => {
    const onSaved = vi.fn();

    renderStep({ onSaved });

    await userEvent.type(await screen.findByLabelText('Catalogue key'), '  abc123  ');
    await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledOnce();
    });
    expect(saveCatalogueKey).toHaveBeenCalledWith('abc123');
  });

  it('saves the key on Enter too', async () => {
    const onSaved = vi.fn();

    renderStep({ onSaved });

    await userEvent.type(await screen.findByLabelText('Catalogue key'), 'abc123{Enter}');

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledOnce();
    });
  });

  it('does nothing on Enter with no key typed', async () => {
    renderStep();

    await userEvent.type(await screen.findByLabelText('Catalogue key'), '{Enter}');

    expect(saveCatalogueKey).not.toHaveBeenCalled();
  });

  it('stays and says so when the key could not be saved', async () => {
    saveCatalogueKey.mockResolvedValue(false);
    const onSaved = vi.fn();

    renderStep({ onSaved });

    await userEvent.type(await screen.findByLabelText('Catalogue key'), 'abc123');
    await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    expect(await screen.findByText('The catalogue key could not be saved.')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('can be left for later, or gone back from', async () => {
    const onSkip = vi.fn();
    const onBack = vi.fn();

    renderStep({ onSkip, onBack });

    await userEvent.click(await screen.findByRole('button', { name: 'Skip for now' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onSkip).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('counts a key the server already has, and simply goes on', async () => {
    fetchAdminOverview.mockResolvedValue({ settings: { hasCatalogueKey: true } });
    const onSaved = vi.fn();

    renderStep({ onSaved });

    expect(await screen.findByText('A catalogue key is already set')).toBeInTheDocument();
    expect(screen.queryByLabelText('Catalogue key')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onSaved).toHaveBeenCalledOnce();
    expect(saveCatalogueKey).not.toHaveBeenCalled();
  });
});
