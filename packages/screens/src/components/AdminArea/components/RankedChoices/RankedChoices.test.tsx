import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RankedChoices } from './RankedChoices';

const OPTIONS = [
  { id: '2160p', label: '2160p' },
  { id: '1080p', label: '1080p' },
  { id: '720p', label: '720p' },
] as const;

/**
 * The list with the choices given ticked.
 */
const show = (chosen: ('2160p' | '1080p' | '720p')[]) => {
  const onChange = vi.fn();

  render(
    <RankedChoices label="Resolutions" options={OPTIONS} chosen={chosen} onChange={onChange} />,
  );

  return onChange;
};

describe('RankedChoices', () => {
  it('lists what is ticked first, in order and numbered, then the rest', () => {
    show(['720p', '1080p']);

    const items = screen.getAllByRole('listitem').map((item) => item.textContent);

    expect(items).toEqual(['1720p', '21080p', '2160p']);
    expect(screen.getByRole('checkbox', { name: '720p' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: '2160p' })).not.toBeChecked();
  });

  it('adds a ticked choice last, and drops an unticked one', async () => {
    const user = userEvent.setup();
    const onChange = show(['1080p']);

    await user.click(screen.getByRole('checkbox', { name: '2160p' }));

    expect(onChange).toHaveBeenLastCalledWith(['1080p', '2160p']);

    await user.click(screen.getByRole('checkbox', { name: '1080p' }));

    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('moves a choice up or down, but not off either end', async () => {
    const user = userEvent.setup();
    const onChange = show(['1080p', '720p']);

    await user.click(screen.getByRole('button', { name: 'Move 720p up' }));

    expect(onChange).toHaveBeenLastCalledWith(['720p', '1080p']);

    await user.click(screen.getByRole('button', { name: 'Move 1080p down' }));

    expect(onChange).toHaveBeenLastCalledWith(['720p', '1080p']);
    expect(screen.getByRole('button', { name: 'Move 1080p up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move 720p down' })).toBeDisabled();
  });

  it('names a chosen value it has no option for by itself', () => {
    render(
      <RankedChoices
        label="Resolutions"
        options={OPTIONS.slice(1)}
        chosen={['2160p']}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('checkbox', { name: '2160p' })).toBeChecked();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RankedChoices.displayName).toBe('RankedChoices');
  });
});
