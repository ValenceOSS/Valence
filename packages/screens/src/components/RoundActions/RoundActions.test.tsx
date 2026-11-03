import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RoundActions } from './RoundActions';
import type { RoundAction } from './RoundActions.types';

const actionsOf = (count: number, onChoose = vi.fn()): RoundAction[] =>
  Array.from({ length: count }, (_, at) => ({
    id: `action-${String(at)}`,
    label: `Action ${String(at)}`,
    onChoose,
  }));

describe('RoundActions', () => {
  it('does what was chosen', async () => {
    const onChoose = vi.fn();

    render(<RoundActions label="More to do" actions={actionsOf(2, onChoose)} />);
    await userEvent.click(screen.getByRole('button', { name: 'Action 1' }));

    expect(onChoose).toHaveBeenCalledOnce();
  });

  it('folds the rest into a menu where there are more than fit', () => {
    render(<RoundActions label="More to do" actions={actionsOf(7)} />);

    expect(screen.getByRole('button', { name: 'Action 3' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Action 4' })).toBeNull();
    expect(screen.getByRole('button', { name: 'More to do' })).toBeTruthy();
  });

  it('names each compact square by its action', () => {
    render(<RoundActions label="More to do" actions={actionsOf(2)} isCompact />);

    expect(screen.getByRole('button', { name: 'Action 0' })).toBeTruthy();
    expect(screen.queryByText('Action 0')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RoundActions.displayName).toBe('RoundActions');
  });
});
