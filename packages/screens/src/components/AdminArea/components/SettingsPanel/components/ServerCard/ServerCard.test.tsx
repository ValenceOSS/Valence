import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { anAdminOverview } from '@ValenceScreens/testing/anAdminOverview';
import { renderWithAnswers } from '@ValenceScreens/testing/renderWithAnswers';
import { ServerCard } from './ServerCard';

const saved = vi.hoisted(() => ({
  saveBrand: vi.fn((brand: object) => Promise.resolve({ ...brand, logo: null })),
  saveRoundness: vi.fn(() => Promise.resolve(true)),
  saveCertificationRegion: vi.fn(() => Promise.resolve(true)),
  saveServerLanguage: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@ValenceClient/admin/saveBrand', () => ({ saveBrand: saved.saveBrand }));
vi.mock('@ValenceClient/admin/saveBrandLogo', () => ({ saveBrandLogo: vi.fn() }));
vi.mock('@ValenceClient/admin/fetchAdmin', () => ({
  saveRoundness: saved.saveRoundness,
  saveCertificationRegion: saved.saveCertificationRegion,
  saveServerLanguage: saved.saveServerLanguage,
}));
vi.mock('@ValenceClient/appearance/fetchAppearance', () => ({
  fetchAppearance: vi.fn(() => new Promise(() => undefined)),
}));

describe('ServerCard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves the name once the typing stops, not once a letter', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithAnswers(<ServerCard overview={anAdminOverview()} />);

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Home');

    expect(saved.saveBrand).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(saved.saveBrand).toHaveBeenCalledTimes(1);
    expect(saved.saveBrand).toHaveBeenCalledWith({ name: 'Home', accent: null, description: null });
  });

  it('saves the corners as they are chosen', async () => {
    const user = userEvent.setup();

    renderWithAnswers(<ServerCard overview={anAdminOverview()} />);

    await user.click(screen.getByRole('button', { name: 'Round' }));

    expect(saved.saveRoundness).toHaveBeenCalledWith('round');
  });

  it('saves the language the whole server speaks, and lets each device speak its own again', async () => {
    const user = userEvent.setup();

    renderWithAnswers(<ServerCard overview={anAdminOverview({ language: 'fr' })} />);

    expect(screen.getByRole('button', { name: /^Language/ })).toHaveTextContent('Français');

    await user.click(screen.getByRole('button', { name: /^Language/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Deutsch' }));

    expect(saved.saveServerLanguage).toHaveBeenCalledWith('de');

    await user.click(screen.getByRole('button', { name: /^Language/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Each device’s own' }));

    expect(saved.saveServerLanguage).toHaveBeenCalledWith(null);
  });
});
