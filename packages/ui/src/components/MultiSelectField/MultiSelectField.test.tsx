import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MultiSelectField } from './MultiSelectField';

const OPTIONS = [
  { id: 'web', label: 'Web', isLocked: true },
  { id: 'desktop', label: 'Desktop app' },
  { id: 'phone', label: 'Phone app' },
  { id: 'tv', label: 'Television app' },
];

describe('MultiSelectField', () => {
  it('writes out what is chosen, in the order it is offered, with what is locked on', () => {
    render(
      <MultiSelectField
        label="Apps"
        options={OPTIONS}
        value={['tv', 'desktop']}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Apps' })).toHaveTextContent(
      'Web, Desktop app, Television app',
    );
  });

  it('says its placeholder while nothing is chosen', () => {
    render(
      <MultiSelectField
        label="Releases"
        options={OPTIONS.slice(1)}
        value={[]}
        placeholder="None"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Releases' })).toHaveTextContent('None');
  });

  it('ticks and unticks choices, staying open, and never takes off one that is locked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <MultiSelectField label="Apps" options={OPTIONS} value={['desktop']} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: 'Apps' }));
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Phone app' }));

    expect(onChange).toHaveBeenLastCalledWith(['web', 'desktop', 'phone']);
    expect(screen.getByRole('menuitemcheckbox', { name: 'Television app' })).toBeInTheDocument();

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Desktop app' }));

    expect(onChange).toHaveBeenLastCalledWith(['web']);
    expect(screen.getByRole('menuitemcheckbox', { name: 'Web' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MultiSelectField.displayName).toBe('MultiSelectField');
  });
});
