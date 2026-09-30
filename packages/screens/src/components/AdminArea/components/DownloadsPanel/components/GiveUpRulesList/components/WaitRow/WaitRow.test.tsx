import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WaitRow } from './WaitRow';

const CHOICES = [
  { id: '6', label: 'Six hours' },
  { id: '24', label: 'A day' },
  { id: 'never', label: 'Never' },
];

/**
 * Draws the row waiting the given number of hours.
 */
const drawn = (value: number | null) => {
  const onChange = vi.fn();

  render(
    <WaitRow
      title="Stalled"
      description="Nobody is sending it."
      choices={CHOICES}
      value={value}
      unit="hours"
      onChange={onChange}
    />,
  );

  return { onChange };
};

describe('WaitRow', () => {
  it('shows the wait chosen', () => {
    drawn(6);

    expect(screen.getByRole('button', { name: /Stalled/ })).toHaveTextContent('Six hours');
  });

  it('shows never for a rule that never gives up', () => {
    drawn(null);

    expect(screen.getByRole('button', { name: /Stalled/ })).toHaveTextContent('Never');
  });

  it('says a wait none of the choices names in its own unit', () => {
    drawn(5);

    expect(screen.getByRole('button', { name: /Stalled/ })).toHaveTextContent('5 hours');
  });

  it('tells the wait chosen, and null for never', async () => {
    const actor = userEvent.setup();
    const { onChange } = drawn(6);

    await actor.click(screen.getByRole('button', { name: /Stalled/ }));
    await actor.click(await screen.findByRole('menuitemradio', { name: /A day/ }));

    expect(onChange).toHaveBeenLastCalledWith(24);

    await actor.click(screen.getByRole('button', { name: /Stalled/ }));
    await actor.click(await screen.findByRole('menuitemradio', { name: /Never/ }));

    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WaitRow.displayName).toBe('WaitRow');
  });
});
