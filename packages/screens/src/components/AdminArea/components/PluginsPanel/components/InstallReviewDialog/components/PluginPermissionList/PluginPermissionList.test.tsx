import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PluginPermissionList } from './PluginPermissionList';

describe('PluginPermissionList', () => {
  it('says each permission in plain words', () => {
    render(
      <PluginPermissionList
        permissions={[
          { kind: 'library', access: 'read' },
          { kind: 'storage', quotaBytes: 5_000_000 },
        ]}
      />,
    );

    expect(screen.getByText('Read your library')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('says when a plugin asks for nothing', () => {
    render(<PluginPermissionList permissions={[]} />);

    expect(screen.getByText(/No permissions beyond showing its own pages/u)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PluginPermissionList.displayName).toBe('PluginPermissionList');
  });
});
