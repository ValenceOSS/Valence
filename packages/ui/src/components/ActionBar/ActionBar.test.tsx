import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ActionBar } from './ActionBar';

const ACTIONS = [
  { id: 'share', label: 'Share', isPinned: true, onChoose: vi.fn() },
  { id: 'party', label: 'Watch together', onChoose: vi.fn() },
];

describe('ActionBar', () => {
  it('keeps the action worth pressing in the bar', () => {
    render(<ActionBar label="More" primary={<span>Play</span>} actions={ACTIONS} />);

    expect(screen.getByText('Play')).toBeInTheDocument();
  });

  it('lays only the pinned ones out beside it, where there is room', () => {
    render(<ActionBar label="More" primary={<span>Play</span>} actions={ACTIONS} />);

    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Watch together' })).not.toBeInTheDocument();
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
    render(<ActionBar label="More" primary={<span>Play</span>} actions={ACTIONS} />);

    expect(screen.getByRole('button', { name: 'Share' })).toHaveClass('bg-[var(--surface-hover)]');
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
});
