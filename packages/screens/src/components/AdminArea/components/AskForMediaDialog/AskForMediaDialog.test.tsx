import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { AskForMediaDialog } from './AskForMediaDialog';
import type * as Admin from '@ValenceClient/admin/fetchAdmin';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';

const searchCatalogue = vi.fn<typeof Admin.searchCatalogue>();
const askForMedia = vi.fn<typeof Requests.askForMedia>();

vi.mock('@ValenceClient/admin/fetchAdmin', async (actual) => ({
  ...(await actual<object>()),
  searchCatalogue: (...given: Parameters<typeof Admin.searchCatalogue>) =>
    searchCatalogue(...given),
}));

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  askForMedia: (...given: Parameters<typeof Requests.askForMedia>) => askForMedia(...given),
}));

const MADE = aMediaRequest({ state: 'awaitingApproval', approval: 'awaiting' });

beforeEach(() => {
  searchCatalogue.mockReset().mockImplementation((_query, kind) =>
    Promise.resolve([
      {
        externalId: kind === 'movie' ? '438631' : '95396',
        kind,
        title: kind === 'movie' ? 'Dune' : 'Severance',
        year: kind === 'movie' ? 2021 : 2022,
        overview: null,
        posterUrl: null,
      },
    ]),
  );
  askForMedia.mockReset().mockResolvedValue({ value: MADE, refusal: null });
});

/**
 * Opens the dialog.
 */
const open = () => {
  const handlers = { onClose: vi.fn(), onAsked: vi.fn() };

  renderInAnAddress(<AskForMediaDialog isOpen {...handlers} />);

  return handlers;
};

describe('AskForMediaDialog', () => {
  it('finds a film in the catalogue and asks for it, held until it is out on disc', async () => {
    const user = userEvent.setup();
    const { onAsked, onClose } = open();

    await user.type(screen.getByRole('textbox', { name: 'Search for a film' }), 'Dune');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: /Dune \(2021\)/ }));
    await user.click(screen.getByRole('button', { name: 'Out on disc' }));
    await user.click(screen.getByRole('button', { name: 'Ask for it' }));

    await waitFor(() => {
      expect(onAsked).toHaveBeenCalledWith(MADE);
    });
    expect(searchCatalogue).toHaveBeenCalledWith('Dune', 'movie');
    expect(askForMedia).toHaveBeenCalledWith({ kind: 'film', tmdbId: 438631, waitFor: 'physical' });
    expect(onClose).toHaveBeenCalled();
  });

  it('asks for some seasons of a series, and not until they are numbers', async () => {
    const user = userEvent.setup();

    open();

    await user.click(screen.getByRole('button', { name: 'A series' }));
    await user.type(screen.getByRole('textbox', { name: 'Search for a series' }), 'Severance');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: /Severance \(2022\)/ }));
    await user.click(screen.getByRole('button', { name: 'Only some seasons' }));

    expect(screen.getByRole('button', { name: 'Ask for it' })).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'Which seasons' }), 'two');

    expect(screen.getByText('Seasons are numbers, such as 1, 3-5.')).toBeInTheDocument();

    await user.clear(screen.getByRole('textbox', { name: 'Which seasons' }));
    await user.type(screen.getByRole('textbox', { name: 'Which seasons' }), '1-2');
    await user.click(screen.getByRole('button', { name: 'Ask for it' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({ kind: 'series', tmdbId: 95396, seasons: [1, 2] });
    });
  });

  it('says why it could not be asked for, and lets another be chosen', async () => {
    const user = userEvent.setup();

    askForMedia.mockResolvedValue({
      value: null,
      refusal: { message: 'There is no library of films to put it in.' },
    });
    open();

    await user.type(screen.getByRole('textbox', { name: 'Search for a film' }), 'Dune');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: /Dune \(2021\)/ }));
    await user.click(screen.getByRole('button', { name: 'Ask for it' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'There is no library of films to put it in.',
    );

    await user.click(screen.getByRole('button', { name: 'Choose another' }));

    expect(screen.getByRole('textbox', { name: 'Search for a film' })).toBeInTheDocument();
  });

  it('says when the catalogue has nothing under a name', async () => {
    const user = userEvent.setup();

    searchCatalogue.mockResolvedValue([]);
    open();

    await user.type(screen.getByRole('textbox', { name: 'Search for a film' }), 'Nothing');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('Nothing came back under that name.')).toBeInTheDocument();
  });
});
