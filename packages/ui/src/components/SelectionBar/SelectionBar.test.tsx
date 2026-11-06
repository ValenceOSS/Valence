import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SelectionBar } from './SelectionBar';

describe('SelectionBar', () => {
  it('says how many are ticked, offers to tick them all, and unticks them', async () => {
    const onSelectAll = vi.fn();
    const onClear = vi.fn();
    const user = userEvent.setup();

    render(
      <SelectionBar count={3} total={40} onSelectAll={onSelectAll} onClear={onClear}>
        <button type="button">Edit</button>
      </SelectionBar>,
    );

    expect(screen.getByRole('toolbar', { name: '3 selected' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Select all 40' }));
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onSelectAll).toHaveBeenCalled();
    expect(onClear).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('offers no ticking of them all once every one is ticked', () => {
    render(<SelectionBar count={40} total={40} onSelectAll={vi.fn()} onClear={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /Select all/u })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SelectionBar.displayName).toBe('SelectionBar');
  });
});
