import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SidebarToggle } from './SidebarToggle';

describe('SidebarToggle', () => {
  it('is named for what pressing it does, and says so when pressed', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<SidebarToggle isOpen label="Close the sidebar" onToggle={onToggle} />);

    await user.click(screen.getByRole('button', { name: 'Close the sidebar' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('holds a mark at rest, one for hovering and one for being held, stacked in one place', () => {
    const { container } = render(<SidebarToggle isOpen label="Close" onToggle={vi.fn()} />);
    const marks = container.querySelectorAll('svg');

    expect(marks).toHaveLength(3);

    for (const mark of marks) {
      expect(mark.getAttribute('class')).toContain('absolute');
    }
  });

  it('shows only the resting mark until the pointer comes', () => {
    const { container } = render(<SidebarToggle isOpen={false} label="Open" onToggle={vi.fn()} />);
    const [resting, hovering, held] = [...container.querySelectorAll('svg')];

    expect(resting?.getAttribute('class')).not.toMatch(/(^|\s)opacity-0/);
    expect(hovering?.getAttribute('class')).toMatch(/(^|\s)opacity-0/);
    expect(held?.getAttribute('class')).toMatch(/(^|\s)opacity-0/);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SidebarToggle.displayName).toBe('SidebarToggle');
  });
});
