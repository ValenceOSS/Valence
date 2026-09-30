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

  it('saves one change after another, so a slow first save cannot undo a second', async () => {
    const actor = userEvent.setup();
    let finishFirst: (sent: Awaited<ReturnType<typeof Rules.changeGiveUpRules>>) => void = () =>
      undefined;

    changeGiveUpRules.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishFirst = resolve;
        }),
    );
    renderInAnAddress(<GiveUpRulesList />);

    await actor.click(await screen.findByRole('button', { name: /Stalled/ }));
    await actor.click(await screen.findByRole('menuitemradio', { name: /Never/ }));
    await actor.click(screen.getByRole('switch', { name: 'Give up on unrecognised files' }));

    expect(changeGiveUpRules).toHaveBeenCalledTimes(1);

    finishFirst({ value: { ...GIVE_UP_DEFAULTS, stalledHours: null }, refusal: null });

    await waitFor(() => {
      expect(changeGiveUpRules).toHaveBeenCalledTimes(2);
    });
    expect(changeGiveUpRules).toHaveBeenLastCalledWith({
      ...GIVE_UP_DEFAULTS,
      stalledHours: null,
      refusesUnknownFiles: false,
    });
  });

  it('reads the rules again only once the saves still waiting have gone', async () => {
    const actor = userEvent.setup();
    let failFirst: (why: Error) => void = () => undefined;
    let finishSecond: (sent: Awaited<ReturnType<typeof Rules.changeGiveUpRules>>) => void = () =>
      undefined;
    const bothSaved = { ...GIVE_UP_DEFAULTS, stalledHours: null, refusesUnknownFiles: false };

    changeGiveUpRules.mockImplementationOnce(
      () =>
        new Promise((resolve, reject) => {
          void resolve;
          failFirst = reject;
        }),
    );
    changeGiveUpRules.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishSecond = resolve;
        }),
    );
    renderInAnAddress(<GiveUpRulesList />);

    await actor.click(await screen.findByRole('button', { name: /Stalled/ }));
    await actor.click(await screen.findByRole('menuitemradio', { name: /Never/ }));
    await actor.click(screen.getByRole('switch', { name: 'Give up on unrecognised files' }));

    fetchGiveUpRules.mockResolvedValue(bothSaved);
    failFirst(new Error('unreadable'));

    await waitFor(() => {
      expect(changeGiveUpRules).toHaveBeenCalledTimes(2);
    });
    expect(fetchGiveUpRules).toHaveBeenCalledTimes(1);

    finishSecond({ value: bothSaved, refusal: null });

    await waitFor(() => {
      expect(fetchGiveUpRules).toHaveBeenCalledTimes(2);
    });
    expect(changeGiveUpRules).toHaveBeenLastCalledWith(bothSaved);
    expect(fetchGiveUpRules.mock.invocationCallOrder[1]).toBeGreaterThan(
      changeGiveUpRules.mock.invocationCallOrder[1] ?? Infinity,
    );
    expect(screen.getByRole('button', { name: /Stalled/ })).toHaveTextContent('Never');
    expect(screen.getByRole('switch', { name: 'Give up on unrecognised files' })).not.toBeChecked();
  });

  it('carries on saving after a save that went wrong', async () => {
    const actor = userEvent.setup();

    changeGiveUpRules.mockRejectedValueOnce(new Error('unreadable'));
    renderInAnAddress(<GiveUpRulesList />);

    await actor.click(await screen.findByRole('button', { name: /Stalled/ }));
    await actor.click(await screen.findByRole('menuitemradio', { name: /Never/ }));

    await waitFor(() => {
      expect(fetchGiveUpRules).toHaveBeenCalledTimes(2);
    });

    await actor.click(screen.getByRole('switch', { name: 'Give up on unrecognised files' }));

    await waitFor(() => {
      expect(changeGiveUpRules).toHaveBeenCalledTimes(2);
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
