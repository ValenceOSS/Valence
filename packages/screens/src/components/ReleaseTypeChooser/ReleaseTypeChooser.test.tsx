import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReleaseTypeChooser } from './ReleaseTypeChooser';

describe('ReleaseTypeChooser', () => {
  it('ticks and unticks kinds of release, keeping the order they are offered', async () => {
    const onChange = vi.fn();

    render(<ReleaseTypeChooser value={['live']} onChange={onChange} />);

    expect(screen.getByRole('checkbox', { name: 'Live' })).toBeChecked();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Albums' }));

    expect(onChange).toHaveBeenLastCalledWith(['album', 'live']);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Live' }));

    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReleaseTypeChooser.displayName).toBe('ReleaseTypeChooser');
  });
});
