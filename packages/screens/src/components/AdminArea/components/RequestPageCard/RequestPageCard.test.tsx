import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { anAdminOverview } from '@ValenceScreens/testing/anAdminOverview';
import { renderWithAnswers } from '@ValenceScreens/testing/renderWithAnswers';
import { RequestPageCard } from './RequestPageCard';

const saved = vi.hoisted(() => ({
  savePlaysCatalogueTrailers: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@ValenceClient/admin/fetchAdmin', () => saved);

describe('RequestPageCard', () => {
  it('saves background trailers as they are switched, where trailers are on', async () => {
    const user = userEvent.setup();

    renderWithAnswers(
      <RequestPageCard overview={anAdminOverview({ fetchesCatalogueTrailers: true })} />,
    );

    await user.click(screen.getByRole('switch', { name: 'Background trailers' }));

    expect(saved.savePlaysCatalogueTrailers).toHaveBeenCalledWith(true);
  });

  it('holds them off and says why while trailers are off', () => {
    renderWithAnswers(<RequestPageCard overview={anAdminOverview()} />);

    expect(screen.getByRole('switch', { name: 'Background trailers' })).toBeDisabled();
    expect(
      screen.getByText('Needs Trailers turned on in Settings › Online services.'),
    ).toBeInTheDocument();
  });
});
