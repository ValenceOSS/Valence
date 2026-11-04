import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingMenu } from './SettingMenu';

const OPTIONS = [
  { id: 'GB', label: 'United Kingdom' },
  { id: 'US', label: 'United States' },
];

describe('SettingMenu', () => {
  it('shows the option chosen, and tells which one is picked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<SettingMenu label="Age ratings" value="GB" options={OPTIONS} onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /Age ratings/ })).toHaveTextContent('United Kingdom');

    await user.click(screen.getByRole('button', { name: /Age ratings/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'United States' }));

    expect(onSelect).toHaveBeenCalledWith('US');
  });

  it('falls back to the words it is given where the value is none of the options', () => {
    render(
      <SettingMenu
        label="Hardware"
        value=""
        options={OPTIONS}
        fallback="Automatic"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByRole('button', { name: /Hardware/ })).toHaveTextContent('Automatic');
  });
});
