import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders an accessible checkbox named by its label', () => {
    render(<Checkbox label="Burn in subtitles" />);

    expect(screen.getByRole('checkbox', { name: 'Burn in subtitles' })).toBeInTheDocument();
  });

  it('reflects a default checked state', () => {
    render(<Checkbox label="Burn in subtitles" defaultChecked />);

    expect(screen.getByRole('checkbox', { name: 'Burn in subtitles' })).toBeChecked();
  });

  it('reports a change when toggled', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox label="Burn in subtitles" onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Burn in subtitles' }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('does not report a change when disabled', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox label="Burn in subtitles" disabled onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Burn in subtitles' }));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Checkbox.displayName).toBe('Checkbox');
  });
});

describe('Checkbox, with a qualification beneath it', () => {
  it('shows a description without putting it in the label', () => {
    render(
      <Checkbox label="A sign-in was refused" description="Rate limiting refuses some first." />,
    );

    expect(screen.getByRole('checkbox', { name: 'A sign-in was refused' })).toBeInTheDocument();
    expect(screen.getByText('Rate limiting refuses some first.')).toBeInTheDocument();
  });

  it('points the checkbox at its description, so it is read out with it', () => {
    render(
      <Checkbox label="A sign-in was refused" description="Rate limiting refuses some first." />,
    );

    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription(
      'Rate limiting refuses some first.',
    );
  });

  it('describes nothing where nothing was said', () => {
    render(<Checkbox label="Plain" />);

    expect(screen.getByRole('checkbox')).not.toHaveAccessibleDescription();
  });
});

describe('Checkbox standing for several things at once', () => {
  it('says it is partly ticked rather than ticked or not', () => {
    render(<Checkbox label="Everything over 20 GB" isMixed />);

    expect(screen.getByRole('checkbox', { name: 'Everything over 20 GB' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  });

  it('is an ordinary checkbox when the things beneath it agree', () => {
    render(<Checkbox label="Everything over 20 GB" checked />);

    expect(screen.getByRole('checkbox', { name: 'Everything over 20 GB' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('still says what it is for', () => {
    render(<Checkbox label="Everything over 20 GB" isMixed />);

    expect(screen.getByText('Everything over 20 GB')).toBeVisible();
  });
});
