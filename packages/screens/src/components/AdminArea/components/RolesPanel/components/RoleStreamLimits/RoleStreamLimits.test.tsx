import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { roleStreamLimit } from '@ValenceClient/admin/roleStreamLimit';
import { saveRoleStreamLimit } from '@ValenceClient/admin/saveRoleStreamLimit';
import { RoleStreamLimits } from './RoleStreamLimits';

vi.mock('@ValenceClient/admin/roleStreamLimit', () => ({ roleStreamLimit: vi.fn() }));
vi.mock('@ValenceClient/admin/saveRoleStreamLimit', () => ({ saveRoleStreamLimit: vi.fn() }));

beforeEach(() => {
  vi.mocked(roleStreamLimit).mockResolvedValue({ maxBitrateKbps: null, maxStreams: null });
});

describe('RoleStreamLimits', () => {
  it('saves the limit everybody holding the role streams under', async () => {
    vi.mocked(saveRoleStreamLimit).mockResolvedValue({ maxBitrateKbps: null, maxStreams: 1 });
    const user = userEvent.setup();

    renderInAnAddress(<RoleStreamLimits roleId="kids" />);

    await user.type(await screen.findByRole('spinbutton', { name: /Streams at once/ }), '1');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(saveRoleStreamLimit).toHaveBeenCalledWith('kids', {
      maxBitrateKbps: null,
      maxStreams: 1,
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RoleStreamLimits.displayName).toBe('RoleStreamLimits');
  });
});
