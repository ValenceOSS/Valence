import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RemoveTitleDialog } from './RemoveTitleDialog';

describe('RemoveTitleDialog', () => {
  it('removes a request, keeping its files unless told otherwise', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();

    render(
      <RemoveTitleDialog title="A Show" isRemoving={false} onClose={vi.fn()} onRemove={onRemove} />,
    );

    expect(screen.getByRole('checkbox', { name: /Delete the files it added/ })).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Remove' }));
    await user.click(screen.getByRole('checkbox', { name: /Delete the files it added/ }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onRemove).toHaveBeenNthCalledWith(1, false);
    expect(onRemove).toHaveBeenNthCalledWith(2, true);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RemoveTitleDialog.displayName).toBe('RemoveTitleDialog');
  });
});
