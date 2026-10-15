import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { changeProfiles } from '@ValenceClient/profiles/changeProfiles';
import { fetchProfileList } from '@ValenceClient/profiles/fetchProfileList';
import { fetchMyPermissions } from '@ValenceClient/session/fetchMyPermissions';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { PeopleStep } from './PeopleStep';

vi.mock('@ValenceClient/profiles/changeProfiles', () => ({ changeProfiles: vi.fn() }));

vi.mock('@ValenceClient/profiles/fetchProfileList', () => ({ fetchProfileList: vi.fn() }));

vi.mock('@ValenceClient/session/fetchMyPermissions', () => ({ fetchMyPermissions: vi.fn() }));

const changed = vi.mocked(changeProfiles);

const listed = vi.mocked(fetchProfileList);

const held = vi.mocked(fetchMyPermissions);

const aProfile = (
  at: number,
  name: string,
  overrides: Partial<ViewerProfile> = {},
): ViewerProfile => ({
  id: `00000000-0000-4000-8000-${at.toString().padStart(12, '0')}`,
  name,
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: false,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const DAN = aProfile(1, 'Dan', { isOwner: true });

const SAM = aProfile(2, 'Sam');

const holding = (profiles: ViewerProfile[]) => {
  listed.mockResolvedValue({ profiles, chosenProfileId: DAN.id });
};

const allowing = (permissions: GrantedPermission[]) => {
  held.mockResolvedValue({ permissions, isAdministrator: false });
};

const draw = (onDone = vi.fn()) => {
  render(<PeopleStep onDone={onDone} />, { wrapper: CacheScope });

  return { onDone, actor: userEvent.setup() };
};

beforeEach(() => {
  changed.mockReset().mockResolvedValue(null);
  listed.mockReset();
  held.mockReset();
  holding([DAN]);
  allowing(['requests.ask']);
});

describe('PeopleStep', () => {
  it('lists who is on the account already, marking the owner as the Profiles panel does', async () => {
    holding([DAN, SAM]);

    draw();

    expect(await screen.findByText('Sam')).toBeInTheDocument();
    expect(screen.getByText('Dan')).toBeInTheDocument();
    expect(screen.getAllByText('Owner')).toHaveLength(1);
  });

  it('offers to go on without anybody else, alone on the account', async () => {
    draw();

    expect(await screen.findByText('Dan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeEnabled();
  });

  it('adds somebody in the next colour along', async () => {
    const { actor } = draw();

    await screen.findByText('Dan');
    await actor.type(screen.getByRole('textbox', { name: 'Add a profile' }), '  Sam  ');
    await actor.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({
        path: '',
        method: 'POST',
        body: { name: 'Sam', colour: PROFILE_COLOURS[1] },
      });
    });
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Add a profile' })).toHaveValue('');
    });
  });

  it('reads the people again once somebody is added', async () => {
    const { actor } = draw();

    await screen.findByText('Dan');

    holding([DAN, SAM]);

    await actor.type(screen.getByRole('textbox', { name: 'Add a profile' }), 'Sam');
    await actor.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Sam')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('will not add somebody with no name', async () => {
    draw();

    await screen.findByText('Dan');

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('says why somebody could not be added, and keeps the name typed', async () => {
    changed.mockResolvedValue('An account can hold 6 profiles.');

    const { actor } = draw();

    await screen.findByText('Dan');
    await actor.type(screen.getByRole('textbox', { name: 'Add a profile' }), 'Sam');
    await actor.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('An account can hold 6 profiles.');
    expect(screen.getByRole('textbox', { name: 'Add a profile' })).toHaveValue('Sam');
  });

  it('offers to add nobody more once the account holds six', async () => {
    holding([
      DAN,
      SAM,
      aProfile(3, 'Three'),
      aProfile(4, 'Four'),
      aProfile(5, 'Five'),
      aProfile(6, 'Six'),
    ]);

    draw();

    await screen.findByText('Six');

    expect(screen.queryByRole('textbox', { name: 'Add a profile' })).not.toBeInTheDocument();
  });

  describe('the owner’s PIN', () => {
    it('is asked for once others share an account that can do more than watch', async () => {
      holding([DAN, SAM]);
      allowing(['requests.ask', 'requests.approve']);

      draw();

      expect(await screen.findByText(/your profile needs a PIN/)).toBeInTheDocument();
      expect(screen.getByLabelText('New PIN')).toBeInTheDocument();
      expect(screen.getByLabelText('Type the PIN again')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });

    it('is not asked for while nobody else shares the account', async () => {
      allowing(['requests.ask', 'requests.approve']);

      draw();

      await screen.findByText('Dan');

      expect(screen.queryByLabelText('New PIN')).not.toBeInTheDocument();
    });

    it('is not asked for on an account that can do no more than every profile may', async () => {
      holding([DAN, SAM]);

      draw();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
      });
      expect(screen.queryByLabelText('New PIN')).not.toBeInTheDocument();
    });

    it('will not let anybody go on before it knows what the account may do', async () => {
      holding([DAN, SAM]);
      held.mockReturnValue(new Promise(() => {}));

      draw();

      await screen.findByText('Sam');

      expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });

    it('is asked for anyway where what the account may do cannot be read', async () => {
      holding([DAN, SAM]);
      held.mockRejectedValue(new Error('offline'));

      draw();

      expect(await screen.findByLabelText('New PIN')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });

    it('is not asked for where the owner has one already', async () => {
      holding([{ ...DAN, hasPin: true }, SAM]);
      allowing(['requests.ask', 'requests.approve']);

      draw();

      await screen.findByText('Sam');

      expect(screen.queryByLabelText('New PIN')).not.toBeInTheDocument();
    });

    it('says when the two do not match, and will not go on', async () => {
      holding([DAN, SAM]);
      allowing(['requests.approve']);

      const { actor } = draw();

      await actor.type(await screen.findByLabelText('New PIN'), '1234');
      await actor.type(screen.getByLabelText('Type the PIN again'), '4321');

      expect(screen.getByText('Those PINs don’t match.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });

    it('is set on the owner’s profile before going on', async () => {
      holding([DAN, SAM]);
      allowing(['requests.approve']);

      const { onDone, actor } = draw();

      await actor.type(await screen.findByLabelText('New PIN'), '1234');
      await actor.type(screen.getByLabelText('Type the PIN again'), '1234');
      await actor.click(screen.getByRole('button', { name: 'Continue' }));

      await waitFor(() => {
        expect(onDone).toHaveBeenCalled();
      });
      expect(changed).toHaveBeenCalledWith({
        path: `/${DAN.id}/pin`,
        method: 'PUT',
        body: { pin: '1234' },
      });
    });

    it('holds somebody here, saying why, where the PIN was not kept', async () => {
      holding([DAN, SAM]);
      allowing(['requests.approve']);
      changed.mockResolvedValue('That PIN could not be saved.');

      const { onDone, actor } = draw();

      await actor.type(await screen.findByLabelText('New PIN'), '1234');
      await actor.type(screen.getByLabelText('Type the PIN again'), '1234');
      await actor.click(screen.getByRole('button', { name: 'Continue' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('That PIN could not be saved.');
      expect(onDone).not.toHaveBeenCalled();
    });
  });

  it('goes on without asking the server anything where nothing is needed', async () => {
    const { onDone, actor } = draw();

    await actor.click(await screen.findByRole('button', { name: 'Not now' }));

    expect(onDone).toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PeopleStep.displayName).toBe('PeopleStep');
  });
});
