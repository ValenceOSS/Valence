import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PermissionRow } from '@ValenceScreens/components/AdminArea/components/RolesPanel/components/PermissionEditor/components/PermissionRow/PermissionRow';
import { PermissionGroup } from './PermissionGroup';

describe('PermissionGroup', () => {
  it('names the group and says how many of its permissions the role holds', () => {
    render(
      <PermissionGroup heading="Jobs" heldCount={1} totalCount={2}>
        <PermissionRow label="Run and schedule jobs" detail="" isOn onToggle={vi.fn()} />
        <PermissionRow label="Reset and rebuild" detail="" isOn={false} onToggle={vi.fn()} />
      </PermissionGroup>,
    );

    expect(screen.getByRole('heading', { name: 'Jobs' })).toBeInTheDocument();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('holds its permissions as one list', () => {
    render(
      <PermissionGroup heading="Jobs" heldCount={0} totalCount={2}>
        <PermissionRow label="Run and schedule jobs" detail="" isOn={false} onToggle={vi.fn()} />
        <PermissionRow label="Reset and rebuild" detail="" isOn={false} onToggle={vi.fn()} />
      </PermissionGroup>,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('switch', { name: 'Reset and rebuild' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PermissionGroup.displayName).toBe('PermissionGroup');
  });
});
