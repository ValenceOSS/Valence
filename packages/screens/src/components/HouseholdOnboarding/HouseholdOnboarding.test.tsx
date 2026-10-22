import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import userEvent from '@testing-library/user-event';
import { HouseholdOnboarding } from './HouseholdOnboarding';
import type { ReactElement } from 'react';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

const saveHousehold = vi.hoisted(() => vi.fn(() => Promise.resolve<object | null>({})));
const uploadHouseholdPhoto = vi.hoisted(() => vi.fn(() => Promise.resolve<string | null>(null)));
const finishOnboarding = vi.hoisted(() => vi.fn(() => Promise.resolve(true)));
const registerPasskey = vi.hoisted(() => vi.fn(() => Promise.resolve({ kind: 'registered' })));

vi.mock('@ValenceClient/household/fetchHousehold', () => ({
  saveHousehold,
  uploadHouseholdPhoto,
  finishOnboarding,
  fetchOnboarding: vi.fn(),
}));

vi.mock('@ValenceClient/session/auth', () => ({ registerPasskey }));

const saveProfileDraft = vi.hoisted(() => vi.fn(() => Promise.resolve<string | null>(null)));
const saveGetStartedProgress = vi.hoisted(() => vi.fn());

vi.mock('@ValenceScreens/profiles/saveProfileDraft', () => ({ saveProfileDraft }));

vi.mock('@ValenceClient/getStarted/getStartedProgress', () => ({
  readGetStartedProgress: () => ({
    done: [],
    skipped: ['music'],
    isDismissed: false,
    isCollapsed: false,
  }),
  saveGetStartedProgress,
}));

vi.mock('@ValenceScreens/components/FaceEditor/FaceEditor', () => ({
  FaceEditor: ({
    isOpen,
    onUse,
  }: {
    isOpen: boolean;
    onUse: (choice: {
      avatar: { kind: 'drawn'; style: 'bottts'; seed: string };
      photo: null;
      colour: '#3a8ee8';
    }) => void;
  }) =>
    isOpen ? (
      <button
        type="button"
        onClick={() => {
          onUse({
            avatar: { kind: 'drawn', style: 'bottts', seed: 'dan' },
            photo: null,
            colour: '#3a8ee8',
          });
        }}
      >
        Use this face
      </button>
    ) : null,
}));

const OWNER: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Dan',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: true,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

vi.mock('@ValenceClient/profiles/fetchProfileList', () => ({
  fetchProfileList: () => Promise.resolve({ profiles: [OWNER], chosenProfileId: OWNER.id }),
}));

vi.mock('@ValenceClient/session/fetchMyPermissions', () => ({
  fetchMyPermissions: () => Promise.resolve({ permissions: [], isAdministrator: false }),
}));

vi.mock('@ValenceClient/profiles/changeProfiles', () => ({
  changeProfiles: vi.fn(() => Promise.resolve(null)),
}));

/**
 * Goes from the picture past the people, adding nobody, onto the passkey.
 */
const pastThePeople = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
  await screen.findByRole('textbox', { name: 'Add a profile' });
  await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
};

const renderSetup = (ui: ReactElement) => render(ui, { wrapper: CacheScope });

const HOUSEHOLD = {
  name: 'Dan',
  colour: '#3ac47d' as const,
  avatar: { kind: 'initial' as const, font: PLUS_JAKARTA_SANS_AS_STORED },
  updatedAt: '2026-09-18T00:00:00.000Z',
};

beforeEach(() => {
  saveHousehold.mockClear().mockResolvedValue({});
  uploadHouseholdPhoto.mockClear().mockResolvedValue(null);
  saveProfileDraft.mockClear().mockResolvedValue(null);
  saveGetStartedProgress.mockClear();
  finishOnboarding.mockClear().mockResolvedValue(true);
  registerPasskey.mockClear().mockResolvedValue({ kind: 'registered' });
});

describe('setting a household up', () => {
  it('starts on the name, filled in with what the account is already called', () => {
    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/Display name/)).toHaveValue('Dan');
  });

  it('will not go on without a name, and says so where it is typed', async () => {
    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={vi.fn()}
      />,
    );

    await userEvent.clear(screen.getByLabelText(/Display name/));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Enter a name.')).toBeInTheDocument();
    expect(saveHousehold).not.toHaveBeenCalled();
  });

  it('saves the name without the spaces somebody typed around it', async () => {
    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={vi.fn()}
      />,
    );

    const field = screen.getByLabelText(/Display name/);

    await userEvent.clear(field);
    await userEvent.type(field, '  The Morgans  ');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(saveHousehold).toHaveBeenCalledWith({ name: 'The Morgans' });
    });
  });

  it('stays where it is when the name could not be saved', async () => {
    saveHousehold.mockResolvedValue(null);

    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Couldn’t save that name.')).toBeInTheDocument();
  });

  it('lets somebody past the picture without choosing one', async () => {
    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('button', { name: 'Not now' })).toBeInTheDocument();
  });

  it('asks who else watches here once the picture is chosen or passed by', async () => {
    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));

    expect(await screen.findByText(/Who else watches here\?/)).toBeInTheDocument();
    expect(await screen.findByRole('textbox', { name: 'Add a profile' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Finish' })).not.toBeInTheDocument();
  });

  it('makes their face with the same editor as the profile, and keeps it on their profile', async () => {
    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Choose a picture' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Use this face' }));

    await waitFor(() => {
      expect(saveProfileDraft).toHaveBeenCalledWith(
        OWNER,
        expect.objectContaining({
          name: 'Dan',
          avatar: { kind: 'drawn', style: 'bottts', seed: 'dan' },
        }),
      );
    });
    expect(await screen.findByRole('button', { name: 'Pick another' })).toBeInTheDocument();
  });

  it('says what was wrong with a face it would not keep', async () => {
    saveProfileDraft.mockResolvedValue('The picture must be 6 MB or smaller.');

    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Choose a picture' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Use this face' }));

    expect(await screen.findByText('The picture must be 6 MB or smaller.')).toBeInTheDocument();
  });

  it('goes back to a step already passed', async () => {
    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Back' }));

    expect(await screen.findByLabelText(/Display name/)).toBeVisible();
  });

  it('remembers a passkey passed by, so getting started does not ask again at once', async () => {
    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await pastThePeople();
    await userEvent.click(await screen.findByRole('button', { name: 'Finish' }));

    await waitFor(() => {
      expect(saveGetStartedProgress).toHaveBeenCalledWith('usr_1', {
        skipped: ['music', 'passkey'],
      });
    });
  });

  it('records nothing as finished until the last step is pressed', async () => {
    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('button', { name: 'Not now' });

    expect(finishOnboarding).not.toHaveBeenCalled();

    await pastThePeople();
    await screen.findByRole('button', { name: 'Finish' });

    expect(finishOnboarding).not.toHaveBeenCalled();
  });

  it('welcomes somebody before handing them the library', async () => {
    const onDone = vi.fn();

    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={onDone}
      />,
    );

    const field = screen.getByLabelText(/Display name/);

    await userEvent.clear(field);
    await userEvent.type(field, 'The Morgans');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await pastThePeople();
    await userEvent.click(await screen.findByRole('button', { name: 'Finish' }));

    expect(await screen.findByText('Welcome to Valence')).toBeInTheDocument();
    expect(screen.getByText(/You’re all set/)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('is done once they say they are ready, and not before', async () => {
    const onDone = vi.fn();

    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={onDone}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await pastThePeople();
    await userEvent.click(await screen.findByRole('button', { name: 'Finish' }));

    await userEvent.click(await screen.findByRole('button', { name: /Start watching/ }));

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled();
    });
  });

  it('says why a passkey cannot be offered rather than leaving the step empty', async () => {
    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await pastThePeople();

    expect(await screen.findByText(/Passkeys need a secure connection/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add a passkey' })).not.toBeInTheDocument();
  });

  it('holds somebody where they are if finishing did not land', async () => {
    const onDone = vi.fn();

    finishOnboarding.mockResolvedValue(false);

    renderSetup(
      <HouseholdOnboarding
        accountId="usr_1"
        name="Valence"
        household={HOUSEHOLD}
        onDone={onDone}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await pastThePeople();
    await userEvent.click(await screen.findByRole('button', { name: 'Finish' }));

    await waitFor(() => {
      expect(finishOnboarding).toHaveBeenCalled();
    });

    expect(onDone).not.toHaveBeenCalled();
  });
});
