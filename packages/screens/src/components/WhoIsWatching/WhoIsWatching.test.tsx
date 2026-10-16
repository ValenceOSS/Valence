import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { chooseProfile } from '@ValenceClient/profiles/chooseProfile';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { WhoIsWatching } from './WhoIsWatching';

vi.mock('@ValenceClient/profiles/chooseProfile', () => ({ chooseProfile: vi.fn() }));

const chosen = vi.mocked(chooseProfile);

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

const DAN = aProfile(1, 'Dan', { isOwner: true, hasPin: true });

const SAM = aProfile(2, 'Sam');

const draw = (onChosen = vi.fn(), onSignOut = vi.fn()) => {
  renderInAnAddress(
    <WhoIsWatching
      name="Valence"
      profiles={[DAN, SAM]}
      onChosen={onChosen}
      onSignOut={onSignOut}
    />,
  );

  return { onChosen, onSignOut, actor: userEvent.setup() };
};

const pinField = () => screen.getByLabelText('PIN');

beforeEach(() => {
  chosen.mockReset();
});

describe('WhoIsWatching', () => {
  it('opens on the PIN of a profile somebody already picked', () => {
    renderInAnAddress(
      <WhoIsWatching
        name="Valence"
        profiles={[DAN, SAM]}
        askingFor={DAN.id}
        onChosen={vi.fn()}
        onSignOut={vi.fn()}
      />,
    );

    expect(pinField()).toBeInTheDocument();
    expect(screen.queryByText('Who’s watching?')).not.toBeInTheDocument();
  });

  it('asks who is watching where the profile picked has no PIN', () => {
    renderInAnAddress(
      <WhoIsWatching
        name="Valence"
        profiles={[DAN, SAM]}
        askingFor={SAM.id}
        onChosen={vi.fn()}
        onSignOut={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('PIN')).not.toBeInTheDocument();
  });

  it('asks who is watching and shows a face for everybody on the account', () => {
    draw();

    expect(screen.getByRole('heading', { name: 'Who’s watching?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dan/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sam/ })).toBeInTheDocument();
  });

  it('marks the faces that have a PIN, and only those', () => {
    draw();

    expect(screen.getAllByRole('img', { name: 'Has a PIN' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Dan/ })).toHaveAccessibleName(/Has a PIN/);
  });

  it('chooses a face without a PIN straight away', async () => {
    chosen.mockResolvedValue({ kind: 'chosen', profile: SAM });

    const { onChosen, actor } = draw();

    await actor.click(screen.getByRole('button', { name: /Sam/ }));

    await waitFor(() => {
      expect(onChosen).toHaveBeenCalledWith(SAM);
    });
    expect(chosen).toHaveBeenCalledWith(SAM.id, {});
  });

  it('asks for the PIN of a face that has one before asking the server anything', async () => {
    const { actor } = draw();

    await actor.click(screen.getByRole('button', { name: /Dan/ }));

    expect(pinField()).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dan' })).toBeInTheDocument();
    expect(chosen).not.toHaveBeenCalled();
  });

  it('will not send a PIN shorter than four digits', async () => {
    const { actor } = draw();

    await actor.click(screen.getByRole('button', { name: /Dan/ }));
    await actor.type(pinField(), '123');

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('keeps only the digits of what is typed into a PIN', async () => {
    const { actor } = draw();

    await actor.click(screen.getByRole('button', { name: /Dan/ }));
    await actor.type(pinField(), '12a34');

    expect(pinField()).toHaveValue('1234');
  });

  it('sends the PIN typed, and lets the profile in once it is right', async () => {
    chosen.mockResolvedValue({ kind: 'chosen', profile: DAN });

    const { onChosen, actor } = draw();

    await actor.click(screen.getByRole('button', { name: /Dan/ }));
    await actor.type(pinField(), '1234');
    await actor.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onChosen).toHaveBeenCalledWith(DAN);
    });
    expect(chosen).toHaveBeenCalledWith(DAN.id, { pin: '1234' });
  });

  it('says the PIN was wrong, and empties it for another go', async () => {
    chosen.mockResolvedValue({ kind: 'needsPin', reason: 'That PIN isn’t right.' });

    const { onChosen, actor } = draw();

    await actor.click(screen.getByRole('button', { name: /Dan/ }));
    await actor.type(pinField(), '9999');
    await actor.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('That PIN isn’t right.')).toBeInTheDocument();
    expect(pinField()).toHaveValue('');
    expect(onChosen).not.toHaveBeenCalled();
  });

  it('says why where the server is making somebody wait', async () => {
    chosen.mockResolvedValue({ kind: 'waiting', reason: 'Too many tries. Wait a minute.' });

    const { actor } = draw();

    await actor.click(screen.getByRole('button', { name: /Dan/ }));
    await actor.type(pinField(), '9999');
    await actor.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Too many tries. Wait a minute.')).toBeInTheDocument();
  });

  it('says why a face was refused on the wall of faces', async () => {
    chosen.mockResolvedValue({ kind: 'refused', reason: 'Valence couldn’t be reached.' });

    const { actor } = draw();

    await actor.click(screen.getByRole('button', { name: /Sam/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Valence couldn’t be reached.');
    expect(screen.getByRole('heading', { name: 'Who’s watching?' })).toBeInTheDocument();
  });

  describe('a PIN the owner must choose', () => {
    const toTheNewPin = async () => {
      chosen.mockResolvedValueOnce({
        kind: 'needsNewPin',
        reason: 'Others share this account, so your profile needs a PIN.',
      });

      const drawn = draw();

      await drawn.actor.click(screen.getByRole('button', { name: /Sam/ }));
      await screen.findByRole('heading', { name: 'Choose a PIN' });

      return drawn;
    };

    it('asks for one, saying why', async () => {
      await toTheNewPin();

      expect(
        screen.getByText('Others share this account, so your profile needs a PIN.'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('New PIN')).toBeInTheDocument();
      expect(screen.getByLabelText('Type the PIN again')).toBeInTheDocument();
    });

    it('says when the two do not match, and will not send them', async () => {
      const { actor } = await toTheNewPin();

      await actor.type(screen.getByLabelText('New PIN'), '1234');
      await actor.type(screen.getByLabelText('Type the PIN again'), '1235');

      expect(screen.getByText('Those PINs don’t match.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });

    it('sends the new PIN once both match', async () => {
      const { onChosen, actor } = await toTheNewPin();

      chosen.mockResolvedValueOnce({ kind: 'chosen', profile: SAM });

      await actor.type(screen.getByLabelText('New PIN'), '2468');
      await actor.type(screen.getByLabelText('Type the PIN again'), '2468');
      await actor.click(screen.getByRole('button', { name: 'Continue' }));

      await waitFor(() => {
        expect(onChosen).toHaveBeenCalledWith(SAM);
      });
      expect(chosen).toHaveBeenLastCalledWith(SAM.id, { newPin: '2468' });
    });
  });

  describe('a forgotten PIN', () => {
    const toForgotten = async () => {
      const drawn = draw();

      await drawn.actor.click(screen.getByRole('button', { name: /Dan/ }));
      await drawn.actor.click(screen.getByRole('button', { name: 'Forgot the PIN?' }));

      return drawn;
    };

    it('asks for the account’s password and a new PIN', async () => {
      await toForgotten();

      expect(
        screen.getByText('Enter the account’s password, then choose a new PIN for Dan.'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('New PIN')).toBeInTheDocument();
      expect(screen.getByLabelText('Type the PIN again')).toBeInTheDocument();
    });

    it('will not send a new PIN without the password', async () => {
      const { actor } = await toForgotten();

      await actor.type(screen.getByLabelText('New PIN'), '5678');
      await actor.type(screen.getByLabelText('Type the PIN again'), '5678');

      expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });

    it('sends the password and the new PIN together', async () => {
      chosen.mockResolvedValue({ kind: 'chosen', profile: DAN });

      const { onChosen, actor } = await toForgotten();

      await actor.type(screen.getByLabelText('Password'), 'hunter2');
      await actor.type(screen.getByLabelText('New PIN'), '5678');
      await actor.type(screen.getByLabelText('Type the PIN again'), '5678');
      await actor.click(screen.getByRole('button', { name: 'Continue' }));

      await waitFor(() => {
        expect(onChosen).toHaveBeenCalledWith(DAN);
      });
      expect(chosen).toHaveBeenCalledWith(DAN.id, { password: 'hunter2', newPin: '5678' });
    });

    it('says the password was wrong and asks for the PIN again', async () => {
      chosen.mockResolvedValue({ kind: 'needsPin', reason: 'Incorrect password.' });

      const { actor } = await toForgotten();

      await actor.type(screen.getByLabelText('Password'), 'wrong');
      await actor.type(screen.getByLabelText('New PIN'), '5678');
      await actor.type(screen.getByLabelText('Type the PIN again'), '5678');
      await actor.click(screen.getByRole('button', { name: 'Continue' }));

      expect(await screen.findByText('Incorrect password.')).toBeInTheDocument();
      expect(pinField()).toBeInTheDocument();
    });
  });

  it('goes back to the faces when somebody picked the wrong person', async () => {
    const { actor } = draw();

    await actor.click(screen.getByRole('button', { name: /Dan/ }));
    await actor.type(pinField(), '12');
    await actor.click(screen.getByRole('button', { name: 'Someone else' }));

    expect(screen.getByRole('heading', { name: 'Who’s watching?' })).toBeInTheDocument();
    expect(screen.queryByLabelText('PIN')).not.toBeInTheDocument();
  });

  it('starts afresh on a face picked again after going back', async () => {
    const { actor } = draw();

    await actor.click(screen.getByRole('button', { name: /Dan/ }));
    await actor.type(pinField(), '12');
    await actor.click(screen.getByRole('button', { name: 'Someone else' }));
    await actor.click(screen.getByRole('button', { name: /Dan/ }));

    expect(pinField()).toHaveValue('');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WhoIsWatching.displayName).toBe('WhoIsWatching');
  });

  it('lets whoever holds the device sign out without choosing anybody', async () => {
    const { onSignOut, actor } = draw();

    await actor.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(onSignOut).toHaveBeenCalled();
    expect(chosen).not.toHaveBeenCalled();
  });
});
