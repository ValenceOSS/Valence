import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AskerPicker } from './AskerPicker';

const ASKERS = [
  { id: 'trusted', name: 'Trusted', detail: 'Three people' },
  { id: 'household', name: 'Household' },
];

const draw = (chosen: string[], onChange = vi.fn()) => {
  render(
    <AskerPicker
      legend="Roles"
      everyLabel="Anybody who may ask"
      askers={ASKERS}
      chosen={new Set(chosen)}
      onChange={onChange}
    />,
  );

  return onChange;
};

describe('AskerPicker', () => {
  it('shows who there is to choose, and what each of them is', () => {
    draw([]);

    expect(screen.getByRole('checkbox', { name: /Trusted/ })).toBeInTheDocument();
    expect(screen.getByText('Three people')).toBeInTheDocument();
  });

  it('reads as anybody while nobody is named', () => {
    draw([]);

    expect(screen.getByRole('checkbox', { name: 'Anybody who may ask' })).toBeChecked();
  });

  it('stops reading as anybody once somebody is named', () => {
    draw(['trusted']);

    expect(screen.getByRole('checkbox', { name: 'Anybody who may ask' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Trusted/ })).toBeChecked();
  });

  it('names somebody when their box is ticked', async () => {
    const onChange = draw([]);

    await userEvent.click(screen.getByRole('checkbox', { name: /Trusted/ }));

    expect(onChange).toHaveBeenCalledWith(new Set(['trusted']));
  });

  it('takes somebody off when their box is cleared', async () => {
    const onChange = draw(['trusted', 'household']);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Household' }));

    expect(onChange).toHaveBeenCalledWith(new Set(['trusted']));
  });

  it('gives a profile back to the house when the box above is ticked', async () => {
    const onChange = draw(['trusted']);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Anybody who may ask' }));

    expect(onChange).toHaveBeenCalledWith(new Set());
  });
});
