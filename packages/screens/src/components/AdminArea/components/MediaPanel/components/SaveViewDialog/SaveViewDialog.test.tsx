import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SaveViewDialog } from './SaveViewDialog';

describe('SaveViewDialog', () => {
  it('saves under the name typed, and not with none', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(<SaveViewDialog isOpen onClose={vi.fn()} onSave={onSave} />);

    expect(screen.getByRole('button', { name: 'Save view' })).toBeDisabled();

    await user.type(screen.getByLabelText('Name'), ' Missing posters ');
    await user.click(screen.getByRole('button', { name: 'Save view' }));

    expect(onSave).toHaveBeenCalledWith('Missing posters');
  });
});
