import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithAnswers } from '@ValenceScreens/testing/renderWithAnswers';
import { PreRollCard } from './PreRollCard';

const SETUP = {
  isOn: true,
  folder: '/media/pre-roll',
  playsBefore: 'films' as const,
  clips: [],
  isFolderReadable: true,
};

const saved = vi.hoisted(() => ({ savePreRollSetup: vi.fn() }));

vi.mock('@ValenceClient/admin/fetchPreRollSetup', () => ({
  fetchPreRollSetup: vi.fn(() => Promise.resolve(SETUP)),
}));
vi.mock('@ValenceClient/admin/savePreRollSetup', () => saved);

describe('PreRollCard', () => {
  it('says where the folder holds no clips', async () => {
    renderWithAnswers(<PreRollCard />);

    expect(
      await screen.findByText('There are no MP4, M4V or MOV files in that folder.'),
    ).toBeInTheDocument();
  });

  it('saves what it plays before as it is chosen, keeping the folder', async () => {
    const user = userEvent.setup();
    saved.savePreRollSetup.mockResolvedValue({ ...SETUP, playsBefore: 'episodes' });

    renderWithAnswers(<PreRollCard />);

    await user.click(await screen.findByRole('button', { name: 'Episodes' }));

    expect(saved.savePreRollSetup).toHaveBeenCalledWith({
      isOn: true,
      playsBefore: 'episodes',
      folder: '/media/pre-roll',
    });
  });
});
