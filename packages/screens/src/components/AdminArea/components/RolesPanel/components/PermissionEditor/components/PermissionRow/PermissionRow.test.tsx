import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PermissionRow } from './PermissionRow';

describe('PermissionRow', () => {
  it('says what a permission lets somebody do, and switches it', async () => {
    const onToggle = vi.fn();

    render(
      <ul>
        <PermissionRow
          label="Sync lists"
          detail="Keep AniList in step."
          isOn={false}
          onToggle={onToggle}
        />
      </ul>,
    );

    expect(screen.getByText('Keep AniList in step.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('switch', { name: 'Sync lists' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows whether the role holds it', () => {
    render(
      <ul>
        <PermissionRow label="Sync lists" detail="Keep AniList in step." isOn onToggle={vi.fn()} />
      </ul>,
    );

    expect(screen.getByRole('switch', { name: 'Sync lists' })).toBeChecked();
  });

  it('can be switched where nothing shuts it', () => {
    render(
      <ul>
        <PermissionRow label="Sync lists" detail="" isOn={false} onToggle={vi.fn()} />
      </ul>,
    );

    expect(screen.getByRole('switch', { name: 'Sync lists' })).toBeEnabled();
  });

  it('cannot be switched while it is shut', async () => {
    const onToggle = vi.fn();

    render(
      <ul>
        <PermissionRow label="Sync lists" detail="" isOn onToggle={onToggle} isDisabled />
      </ul>,
    );

    const toggle = screen.getByRole('switch', { name: 'Sync lists' });

    expect(toggle).toBeDisabled();

    await userEvent.click(toggle);

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PermissionRow.displayName).toBe('PermissionRow');
  });
});
