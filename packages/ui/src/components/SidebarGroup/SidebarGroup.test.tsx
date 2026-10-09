import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Home as HomeIcon } from '@keyline-icons/react';
import { SidebarGroup } from './SidebarGroup';

const ITEMS = [
  { id: 'sessions', label: 'Sessions', icon: HomeIcon },
  { id: 'links', label: 'Links', icon: HomeIcon },
];

const group = (extra: Partial<Parameters<typeof SidebarGroup>[0]> = {}) => (
  <SidebarGroup
    label="Activity"
    items={ITEMS}
    value="sessions"
    onSelect={vi.fn()}
    markGroup="mark"
    pointedAt={null}
    onPointAt={vi.fn()}
    {...extra}
  />
);

describe('SidebarGroup', () => {
  it('shows every destination with its icon, whether or not it is current', () => {
    const { container } = render(group());

    expect(screen.getByRole('button', { name: 'Links' })).toBeInTheDocument();
    expect(container.querySelectorAll('li svg')).toHaveLength(ITEMS.length);
  });

  it('hangs the destinations of a labelled group from one line', () => {
    const { container } = render(group());

    expect(container.querySelector('ul')?.className).toContain('before:w-px');
  });

  it('marks the current destination on the line, and no other', () => {
    render(group());

    expect(screen.getByRole('button', { name: 'Sessions' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Links' })).not.toHaveAttribute('aria-current');
  });

  it('folds and unfolds by its label, and says which it is', async () => {
    const user = userEvent.setup();

    render(group());

    const fold = screen.getByRole('button', { name: 'Activity' });

    expect(fold).toHaveAttribute('aria-expanded', 'true');

    await user.click(fold);

    expect(fold).toHaveAttribute('aria-expanded', 'false');
  });

  it('is held open or folded by its caller, and tells the caller when it is pressed', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(group({ isOpen: false, onOpenChange }));

    const fold = screen.getByRole('button', { name: 'Activity' });

    expect(fold).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Links' })).not.toBeInTheDocument();

    await user.click(fold);

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('cannot be folded where it has no label', () => {
    render(
      <SidebarGroup
        items={ITEMS}
        value="sessions"
        onSelect={vi.fn()}
        markGroup="mark"
        pointedAt={null}
        onPointAt={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { expanded: true })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sessions' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SidebarGroup.displayName).toBe('SidebarGroup');
  });
});
