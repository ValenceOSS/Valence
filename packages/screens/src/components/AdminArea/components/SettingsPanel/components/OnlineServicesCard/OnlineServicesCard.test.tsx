import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { anAdminOverview } from '@ValenceScreens/testing/anAdminOverview';
import { renderWithAnswers } from '@ValenceScreens/testing/renderWithAnswers';
import { OnlineServicesCard } from './OnlineServicesCard';

const saved = vi.hoisted(() => ({
  saveCatalogueKey: vi.fn(() => Promise.resolve(true)),
  saveOmdbKey: vi.fn(() => Promise.resolve(true)),
  saveAudioDbKey: vi.fn(() => Promise.resolve(true)),
  saveFetchesCatalogueTrailers: vi.fn(() => Promise.resolve(true)),
  saveFetchesMusicDetails: vi.fn(() => Promise.resolve(true)),
  saveUsesPushRelay: vi.fn(() => Promise.resolve(true)),
  saveTelemetryEnabled: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@ValenceClient/admin/fetchAdmin', () => saved);

describe('OnlineServicesCard', () => {
  it('says which services have a key, and saves a feature as it is switched', async () => {
    const user = userEvent.setup();

    renderWithAnswers(<OnlineServicesCard overview={anAdminOverview({ hasCatalogueKey: true })} />);

    expect(screen.getByText('Key set')).toBeInTheDocument();
    expect(screen.getAllByText('No key')).toHaveLength(3);

    await user.click(screen.getByRole('switch', { name: 'Trailers' }));

    expect(saved.saveFetchesCatalogueTrailers).toHaveBeenCalledWith(true);
  });

  it('holds usage statistics off, and says why, where the environment forbids sending', () => {
    renderWithAnswers(
      <OnlineServicesCard overview={anAdminOverview({ isTelemetryOffByEnvironment: true })} />,
    );

    expect(screen.getByRole('switch', { name: 'Usage statistics' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Usage statistics' })).not.toBeChecked();
    expect(screen.queryByRole('button', { name: "See what's sent" })).not.toBeInTheDocument();
  });
});
