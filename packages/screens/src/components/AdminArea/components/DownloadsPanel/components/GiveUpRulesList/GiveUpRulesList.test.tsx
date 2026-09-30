import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GIVE_UP_DEFAULTS } from '@ValenceContracts/schemas/GiveUpRules';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { GiveUpRulesList } from './GiveUpRulesList';
import type * as Rules from '@ValenceClient/requests/fetchGiveUpRules';

const fetchGiveUpRules = vi.fn<typeof Rules.fetchGiveUpRules>();
const changeGiveUpRules = vi.fn<typeof Rules.changeGiveUpRules>();

vi.mock('@ValenceClient/requests/fetchGiveUpRules', () => ({
  fetchGiveUpRules: () => fetchGiveUpRules(),
  changeGiveUpRules: (...given: Parameters<typeof Rules.changeGiveUpRules>) =>
    changeGiveUpRules(...given),
}));

beforeEach(() => {
  fetchGiveUpRules.mockReset().mockResolvedValue(GIVE_UP_DEFAULTS);
  changeGiveUpRules
    .mockReset()
    .mockImplementation((rules) => Promise.resolve({ value: rules, refusal: null }));
});

describe('GiveUpRulesList', () => {
  it('shows how long each kind of trouble is waited out', async () => {
    renderInAnAddress(<GiveUpRulesList />);

    expect(await screen.findByRole('button', { name: /Missing metadata/ })).toHaveTextContent(
      'An hour',
    );
    expect(screen.getByRole('button', { name: /Stalled/ })).toHaveTextContent('Six hours');
    expect(screen.getByRole('button', { name: /Too slow/ })).toHaveTextContent('A week');
    expect(screen.getByRole('switch', { name: 'Give up on unrecognised files' })).toBeChecked();
  });

  it('saves a rule as soon as it is changed, keeping the others', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(<GiveUpRulesList />);

    await actor.click(await screen.findByRole('button', { name: /Stalled/ }));
    await actor.click(await screen.findByRole('menuitemradio', { name: /Never/ }));

    expect(changeGiveUpRules).toHaveBeenCalledWith({ ...GIVE_UP_DEFAULTS, stalledHours: null });
    expect(screen.getByRole('button', { name: /Stalled/ })).toHaveTextContent('Never');

    await actor.click(screen.getByRole('switch', { name: 'Give up on unrecognised files' }));

    expect(changeGiveUpRules).toHaveBeenLastCalledWith({
      ...GIVE_UP_DEFAULTS,
      stalledHours: null,
      refusesUnknownFiles: false,
    });
  });

  it('reads the rules again when a change is refused', async () => {
    const actor = userEvent.setup();

    changeGiveUpRules.mockResolvedValue({ value: null, refusal: { message: 'No.' } });
    renderInAnAddress(<GiveUpRulesList />);

    await actor.click(await screen.findByRole('button', { name: /Too slow/ }));
    await actor.click(await screen.findByRole('menuitemradio', { name: /A month/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Too slow/ })).toHaveTextContent('A week');
    });
    expect(fetchGiveUpRules).toHaveBeenCalledTimes(2);
  });

  it('says so when the rules cannot be read', async () => {
    fetchGiveUpRules.mockRejectedValue(new Error('down'));
    renderInAnAddress(<GiveUpRulesList />);

    expect(await screen.findByRole('button', { name: /Try again/ })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(GiveUpRulesList.displayName).toBe('GiveUpRulesList');
  });
});
