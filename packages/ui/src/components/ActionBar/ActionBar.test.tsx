import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ActionBar } from './ActionBar';

/**
 * One of the bar's arrangements, where every arrangement is drawn and CSS shows one of them.
 *
 * @param container - What was drawn.
 * @param slot - Which arrangement.
 * @returns It.
 */
const arrangement = (container: HTMLElement, slot: 'whole' | 'pinned'): HTMLElement => {
  const found = container.querySelector(`[data-slot="action-bar-${slot}"]`);

  if (!(found instanceof HTMLElement)) {
    throw new Error(`No ${slot} arrangement`);
  }

  return found;
};

const ACTIONS = [
  { id: 'share', label: 'Share', isPinned: true, onChoose: vi.fn() },
  { id: 'party', label: 'Watch together', onChoose: vi.fn() },
];

describe('ActionBar', () => {
  it('keeps the action worth pressing in the bar', () => {
    render(<ActionBar label="More" primary={<span>Play</span>} actions={ACTIONS} />);

    expect(screen.getByText('Play')).toBeInTheDocument();
  });

  it('lays only the pinned ones out beside it, where there is room for no more', () => {
    const { container } = render(
      <ActionBar label="More" primary={<span>Play</span>} actions={ACTIONS} />,
    );
    const pinned = arrangement(container, 'pinned');

    expect(within(pinned).getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(
      within(pinned).queryByRole('button', { name: 'Watch together' }),
    ).not.toBeInTheDocument();
  });

  it('lays every one out where there are few enough, for a bar wide enough to hold them', () => {
    const { container } = render(
      <ActionBar label="More" primary={<span>Play</span>} actions={ACTIONS} />,
    );
    const whole = arrangement(container, 'whole');

    expect(within(whole).getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(within(whole).getByRole('button', { name: 'Watch together' })).toBeInTheDocument();
    expect(within(whole).queryByRole('button', { name: 'More' })).not.toBeInTheDocument();
    expect(whole).toHaveClass('@4xl:flex');
    expect(arrangement(container, 'pinned')).toHaveClass('@4xl:hidden');
  });

  it('never lays out more than four, however wide the bar', () => {
    const { container } = render(
      <ActionBar
        label="More"
        primary={<span>Play</span>}
        actions={['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, label: id, onChoose: vi.fn() }))}
      />,
    );

    expect(container.querySelector('[data-slot="action-bar-whole"]')).toBeNull();
  });

  it('keeps everything that is not pinned one press away in a menu', async () => {
    const user = userEvent.setup();

    render(<ActionBar label="More" primary={<span>Play</span>} actions={ACTIONS} />);

    const [menu] = screen.getAllByRole('button', { name: 'More' });

    expect(menu).toBeDefined();

    if (menu !== undefined) {
      await user.click(menu);
    }

    expect(await screen.findByRole('menuitem', { name: /Watch together/ })).toBeInTheDocument();
  });

  it('does the thing an action is for when it is pressed', async () => {
    const onChoose = vi.fn();
    const user = userEvent.setup();

    render(
      <ActionBar
        label="More"
        primary={<span>Play</span>}
        actions={[{ id: 'share', label: 'Share', isPinned: true, onChoose }]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(onChoose).toHaveBeenCalledOnce();
  });

  it('draws the rest as the default gray button, the same as every other', () => {
    const { container } = render(
      <ActionBar label="More" primary={<span>Play</span>} actions={ACTIONS} />,
    );

    expect(
      within(arrangement(container, 'pinned')).getByRole('button', { name: 'Share' }),
    ).toHaveClass('bg-[var(--surface-hover)]');
  });

  it('folds them into a menu for a phone, named for anybody who cannot see the dots', () => {
    render(
      <ActionBar label="More to do with this" primary={<span>Play</span>} actions={ACTIONS} />,
    );

    expect(screen.getAllByRole('button', { name: 'More to do with this' }).length).toBeGreaterThan(
      0,
    );
  });

  it('offers no menu on a wide screen where everything is pinned, since nothing is folded', () => {
    render(
      <ActionBar
        label="More to do with this"
        primary={<span>Play</span>}
        actions={[{ id: 'share', label: 'Share', isPinned: true, onChoose: vi.fn() }]}
      />,
    );

    expect(screen.getAllByRole('button', { name: 'More to do with this' })).toHaveLength(1);
  });

  it('has no menu to fold anything into where there is nothing else to do', () => {
    render(<ActionBar label="More to do with this" primary={<span>Play</span>} actions={[]} />);

    expect(screen.queryByRole('button', { name: 'More to do with this' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ActionBar.displayName).toBe('ActionBar');
  });

  it('paints the actions beside the main one in the default gray rather than black', () => {
    render(
      <ActionBar
        label="More"
        primary={<button type="button">Play</button>}
        actions={[{ id: 'share', label: 'Share', isPinned: true, onChoose: vi.fn() }]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Share' })).toHaveClass('bg-[var(--surface-hover)]');
    expect(screen.getByRole('button', { name: 'Share' })).not.toHaveClass('bg-background');
  });

  it('centres the actions on one another vertically', () => {
    const { container } = render(
      <ActionBar
        label="More"
        primary={<button type="button">Play</button>}
        actions={[{ id: 'share', label: 'Share', isPinned: true, onChoose: vi.fn() }]}
      />,
    );

    expect(container.firstElementChild).toHaveClass('items-center', 'justify-between');
  });

  it('opens the choices of a pinned action that has them, rather than doing one thing', async () => {
    const user = userEvent.setup();
    const season = vi.fn();

    render(
      <ActionBar
        label="More"
        primary={<span>Play</span>}
        actions={[
          {
            id: 'download',
            label: 'Download',
            isPinned: true,
            onChoose: vi.fn(),
            choices: [
              { id: 'season', label: 'Season 1', onChoose: season },
              { id: 'every', label: 'Every season', onChoose: vi.fn() },
            ],
          },
        ]}
      />,
    );

    const [opening] = screen.getAllByRole('button', { name: 'Download' });

    if (opening !== undefined) {
      await user.click(opening);
    }

    await user.click(await screen.findByRole('menuitem', { name: /Season 1/ }));

    expect(season).toHaveBeenCalled();
  });

  it('folds an action with choices into the menu as a group under its name', async () => {
    const user = userEvent.setup();

    render(
      <ActionBar
        label="More"
        primary={<span>Play</span>}
        actions={[
          ...ACTIONS,
          {
            id: 'download',
            label: 'Download',
            onChoose: vi.fn(),
            choices: [{ id: 'every', label: 'Every season', onChoose: vi.fn() }],
          },
        ]}
      />,
    );

    const [menu] = screen.getAllByRole('button', { name: 'More' });

    if (menu !== undefined) {
      await user.click(menu);
    }

    expect(await screen.findByRole('menuitem', { name: /Every season/ })).toBeInTheDocument();
    expect(screen.getAllByText('Download').length).toBeGreaterThan(0);
    expect(screen.getByRole('menuitem', { name: /Watch together/ })).toBeInTheDocument();
  });
});
