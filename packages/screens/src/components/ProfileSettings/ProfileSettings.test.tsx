import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chooseTheme, chosenTheme } from '@ValenceClient/shell/theme';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ProfileSettings } from './ProfileSettings';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfileDraft } from './ProfileSettings.types';

const PROFILE: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Marques',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  prefersBestCopy: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const DRAFT: ProfileDraft = {
  name: PROFILE.name,
  colour: PROFILE.colour,
  avatar: PROFILE.avatar,
  askStillWatchingAfter: PROFILE.askStillWatchingAfter,
  showsWhatIamWatching: PROFILE.showsWhatIamWatching,
  prefersBestCopy: false,
  photo: null,
};

beforeEach(() => {
  chooseTheme('system');
});

describe('ProfileSettings', () => {
  it('offers every theme there is, named the way the account menu names them', () => {
    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={vi.fn()} />);

    const themes = screen.getByRole('group', { name: 'Theme' });

    for (const name of ['System', 'Light', 'Dark']) {
      expect(within(themes).getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('changes the theme at once, since how the screen looks is not part of the draft', async () => {
    const actor = userEvent.setup();
    const onDraft = vi.fn();

    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={onDraft} />);

    await actor.click(
      within(screen.getByRole('group', { name: 'Theme' })).getByRole('button', { name: 'Dark' }),
    );

    expect(chosenTheme()).toBe('dark');
    expect(onDraft).not.toHaveBeenCalled();
  });

  it('writes a new name into the draft rather than saving it', async () => {
    const actor = userEvent.setup();
    const onDraft = vi.fn();

    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={onDraft} />);

    await actor.type(screen.getByLabelText('Display name'), '!');

    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ name: 'Marques!' }));
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ProfileSettings.displayName).toBe('ProfileSettings');
  });

  it('offers no way to show Discord status outside the desktop client', () => {
    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={vi.fn()} />);

    expect(screen.queryByText('Show what I am playing on Discord')).not.toBeInTheDocument();
  });

  it('offers it on the desktop client, since only it can reach Discord', () => {
    installATestClient({ thisClientKind: () => 'desktop' });

    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={vi.fn()} />);

    expect(screen.getByText('Show what I am playing on Discord')).toBeInTheDocument();
  });

  it('writes preferring the best copy into the draft', async () => {
    const onDraft = vi.fn();

    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={onDraft} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Prefer the best copy' }));

    expect(onDraft).toHaveBeenCalledWith({ prefersBestCopy: true });
  });
});
