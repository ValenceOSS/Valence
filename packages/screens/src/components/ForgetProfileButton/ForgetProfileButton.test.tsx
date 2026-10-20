import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aViewerProfile } from '@ValenceClient/testing/aViewerProfile';
import { notify } from '@ValenceUI/notify';
import { ForgetProfileButton } from './ForgetProfileButton';
import type * as Notify from '@ValenceUI/notify';

const removeProfile = vi.hoisted(() => vi.fn<(profileId: string) => Promise<boolean>>());

vi.mock('@ValenceClient/profiles/fetchProfiles', () => ({ removeProfile }));

vi.mock('@ValenceUI/notify', async (importOriginal) => {
  const original = await importOriginal<typeof Notify>();

  return { ...original, notify: { ...original.notify, failed: vi.fn() } };
});

const SAM = aViewerProfile({ id: 'p-sam', name: 'Sam', isOwner: false });

beforeEach(() => {
  removeProfile.mockReset().mockResolvedValue(true);
  vi.mocked(notify.failed).mockReset();
});

describe('ForgetProfileButton', () => {
  it('takes somebody off the account and says so', async () => {
    const onForgotten = vi.fn();

    render(<ForgetProfileButton profile={SAM} onForgotten={onForgotten} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Sam' }));

    await waitFor(() => {
      expect(onForgotten).toHaveBeenCalled();
    });
    expect(removeProfile).toHaveBeenCalledWith('p-sam');
  });

  it('is never offered for the owner', () => {
    render(
      <ForgetProfileButton
        profile={aViewerProfile({ name: 'Dan', isOwner: true })}
        onForgotten={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('says when somebody could not be taken off, and keeps them', async () => {
    const onForgotten = vi.fn();

    removeProfile.mockResolvedValue(false);
    render(<ForgetProfileButton profile={SAM} onForgotten={onForgotten} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Sam' }));

    await waitFor(() => {
      expect(notify.failed).toHaveBeenCalled();
    });
    expect(onForgotten).not.toHaveBeenCalled();
  });
});
