import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { changeProfiles } from '@ValenceClient/profiles/changeProfiles';
import { fetchProfileList } from '@ValenceClient/profiles/fetchProfileList';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { PeopleStep } from './PeopleStep';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

vi.mock('@ValenceClient/profiles/changeProfiles', () => ({ changeProfiles: vi.fn() }));

vi.mock('@ValenceClient/profiles/fetchProfileList', () => ({ fetchProfileList: vi.fn() }));

const changed = vi.mocked(changeProfiles);

const listed = vi.mocked(fetchProfileList);

const aProfile = (
  at: number,
  name: string,
  overrides: Partial<ViewerProfile> = {},
): ViewerProfile => ({
  id: `00000000-0000-4000-8000-${at.toString().padStart(12, '0')}`,
  name,
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
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

const draw = (onDone = vi.fn()) => {
  render(<PeopleStep onDone={onDone} />, { wrapper: CacheScope });

  return { onDone, actor: userEvent.setup() };
};

beforeEach(() => {
  changed.mockReset().mockResolvedValue(null);
  listed.mockReset();
  holding([DAN]);
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

  it('asks for no PIN once others share the account', async () => {
    holding([DAN, SAM]);

    const { onDone, actor } = draw();

    await actor.click(await screen.findByRole('button', { name: 'Continue' }));

    expect(screen.queryByLabelText('New PIN')).not.toBeInTheDocument();
    expect(onDone).toHaveBeenCalled();
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
