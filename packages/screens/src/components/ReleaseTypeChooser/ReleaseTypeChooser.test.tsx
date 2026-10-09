import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReleaseTypeChooser } from './ReleaseTypeChooser';

describe('ReleaseTypeChooser', () => {
  it('chooses kinds of release from one field, keeping the order they are offered', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ReleaseTypeChooser value={['live']} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Releases' }));

    expect(screen.getByRole('menuitemcheckbox', { name: 'Live' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Albums' }));

    expect(onChange).toHaveBeenLastCalledWith(['album', 'live']);

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Live' }));

    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReleaseTypeChooser.displayName).toBe('ReleaseTypeChooser');
  });
});
