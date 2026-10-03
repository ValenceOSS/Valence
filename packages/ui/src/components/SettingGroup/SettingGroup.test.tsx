import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SettingGroup } from './SettingGroup';

describe('SettingGroup', () => {
  it('says what the setting is and what answering it does, with its fields beneath', () => {
    render(
      <SettingGroup title="Mail server" description="Where mail is sent from.">
        <input aria-label="Address" />
      </SettingGroup>,
    );

    expect(screen.getByText('Mail server')).toBeInTheDocument();
    expect(screen.getByText('Where mail is sent from.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Address' })).toBeInTheDocument();
  });

  it('says nothing more where it has no description', () => {
    const { container } = render(
      <SettingGroup title="Mail server">
        <span>Fields</span>
      </SettingGroup>,
    );

    expect(container.querySelectorAll('.text-text-muted')).toHaveLength(0);
  });

  it('is spaced as the rows of a setting list are', () => {
    const { container } = render(
      <SettingGroup title="Mail server" className="extra">
        <span>Fields</span>
      </SettingGroup>,
    );

    expect(container.firstElementChild).toHaveAttribute('data-slot', 'setting-group');
    expect(container.firstElementChild).toHaveClass('py-4', 'extra');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SettingGroup.displayName).toBe('SettingGroup');
  });
});
