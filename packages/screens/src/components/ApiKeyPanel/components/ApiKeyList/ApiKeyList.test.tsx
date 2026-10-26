import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ApiKey } from '@ValenceContracts/schemas/ApiKey';
import { ApiKeyList } from './ApiKeyList';
import type { ApiKeyListProps } from './ApiKeyList.types';

const HOME_ASSISTANT: ApiKey = {
  id: 'key-1',
  name: 'Home Assistant',
  start: 'vk_7Qm2',
  enabled: true,
  expiresAt: null,
  lastRequestAt: null,
  requestCount: 0,
  permissions: null,
  rateLimit: { max: 60, everySeconds: 60 },
  createdAt: '2026-01-01T00:00:00.000Z',
};

const BACKUPS: ApiKey = {
  ...HOME_ASSISTANT,
  id: 'key-2',
  name: 'Backup script',
  start: 'vk_c41e',
  enabled: false,
  permissions: ['media.rescan', 'jobs.run', 'library.edit'],
  rateLimit: null,
};

const draw = (overrides: Partial<ApiKeyListProps> = {}) => {
  const calls = {
    onNameChange: vi.fn(),
    onCreate: vi.fn(),
    onCopy: vi.fn(),
    onToggle: vi.fn(),
    onRevoke: vi.fn(),
  };

  render(
    <ApiKeyList
      keys={[HOME_ASSISTANT, BACKUPS]}
      made={null}
      hasCopied={false}
      name=""
      isMaking={false}
      {...calls}
      {...overrides}
    />,
  );

  return { ...calls, user: userEvent.setup() };
};

describe('ApiKeyList', () => {
  it('lists each key by what it is for and how it starts', () => {
    draw();

    expect(screen.getByText('Home Assistant')).toBeInTheDocument();
    expect(screen.getByText('vk_7Qm2…')).toBeInTheDocument();
    expect(screen.getByText('Backup script')).toBeInTheDocument();
  });

  it('says so where there are no keys yet', () => {
    draw({ keys: [] });

    expect(screen.getByText('No keys yet.')).toBeInTheDocument();
  });

  it('shows the key just made in full, once, and copies it', async () => {
    const { onCopy, user } = draw({ made: { name: 'Discord bot', key: 'vk_Hn4r8TzQ2mWc07bdLx' } });

    expect(screen.getByText('vk_Hn4r8TzQ2mWc07bdLx')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('says the key just made was copied', () => {
    draw({ made: { name: 'Discord bot', key: 'vk_Hn4r8TzQ2mWc07bdLx' }, hasCopied: true });

    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('passes on what the next key is for and asks for it to be made', async () => {
    const { onNameChange, onCreate, user } = draw();

    await user.type(screen.getByLabelText('What is this key for?'), 'D');
    await user.click(screen.getByRole('button', { name: 'Create key' }));

    expect(onNameChange).toHaveBeenCalledWith('D');
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('hands on the key to turn off or revoke', async () => {
    const { onToggle, onRevoke, user } = draw();

    await user.click(screen.getByRole('switch', { name: 'Disable Home Assistant' }));
    await user.click(screen.getByRole('button', { name: 'Revoke Backup script' }));

    expect(onToggle).toHaveBeenCalledWith(HOME_ASSISTANT);
    expect(onRevoke).toHaveBeenCalledWith(BACKUPS);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ApiKeyList.displayName).toBe('ApiKeyList');
  });
});
