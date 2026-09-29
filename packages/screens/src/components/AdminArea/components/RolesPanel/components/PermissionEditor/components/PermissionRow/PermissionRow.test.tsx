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
});
