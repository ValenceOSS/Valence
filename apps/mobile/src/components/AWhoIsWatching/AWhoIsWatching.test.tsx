import { render, userEvent, waitFor } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { chooseProfile } from '@ValenceClient/profiles/chooseProfile';
import { aProfile } from '@ValenceMobile/testing/aProfile';
import { AWhoIsWatching } from './AWhoIsWatching';

jest.mock('@ValenceClient/profiles/chooseProfile', () => ({ chooseProfile: jest.fn() }));

const chosen = jest.mocked(chooseProfile);

const DAN = aProfile({ hasPin: true });

const SAM = aProfile({
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Sam',
  isOwner: false,
});

const draw = (onChosen = jest.fn(), onSignOut = jest.fn()) =>
  render(<AWhoIsWatching profiles={[DAN, SAM]} onChosen={onChosen} onSignOut={onSignOut} />, {
    wrapper: CacheScope,
  });

type Drawn = Awaited<ReturnType<typeof draw>>;

const toThePin = async (drawn: Drawn) => {
  await userEvent.press(drawn.getByRole('button', { name: 'Dan' }));
};

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
  chosen.mockReset();
});

afterEach(() => {
  forgetPlatform();
});

describe('AWhoIsWatching', () => {
  it('asks who is watching and shows a face for everybody on the account', async () => {
    const drawn = await draw();

    expect(drawn.getByText('Who’s watching?')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Dan' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Sam' })).toBeTruthy();
  });

  it('names each face once', async () => {
    const drawn = await draw();

    expect(drawn.getAllByText('Dan')).toHaveLength(1);
    expect(drawn.getAllByText('Sam')).toHaveLength(1);
  });

  it('chooses a face without a PIN straight away', async () => {
    chosen.mockResolvedValue({ kind: 'chosen', profile: SAM });

    const onChosen = jest.fn();
    const drawn = await draw(onChosen);

    await userEvent.press(drawn.getByRole('button', { name: 'Sam' }));

    await waitFor(() => {
      expect(onChosen).toHaveBeenCalled();
    });
    expect(chosen).toHaveBeenCalledWith(SAM.id, {});
  });

  it('asks for the PIN of a face that has one before asking the server anything', async () => {
    const drawn = await draw();

    await toThePin(drawn);

    expect(drawn.getByLabelText('PIN')).toBeTruthy();
    expect(drawn.getByText('Dan')).toBeTruthy();
    expect(chosen).not.toHaveBeenCalled();
  });

  it('will not send a PIN shorter than four digits', async () => {
    const drawn = await draw();

    await toThePin(drawn);
    await userEvent.type(drawn.getByLabelText('PIN'), '123');

    expect(drawn.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('sends the PIN typed, and lets the profile in once it is right', async () => {
    chosen.mockResolvedValue({ kind: 'chosen', profile: DAN });

    const onChosen = jest.fn();
    const drawn = await draw(onChosen);

    await toThePin(drawn);
    await userEvent.type(drawn.getByLabelText('PIN'), '1234');
    await userEvent.press(drawn.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onChosen).toHaveBeenCalled();
    });
    expect(chosen).toHaveBeenCalledWith(DAN.id, { pin: '1234' });
  });

  it('says the PIN was wrong, and empties it for another go', async () => {
    chosen.mockResolvedValue({ kind: 'needsPin', reason: 'That PIN isn’t right.' });

    const onChosen = jest.fn();
    const drawn = await draw(onChosen);

    await toThePin(drawn);
    await userEvent.type(drawn.getByLabelText('PIN'), '9999');
    await userEvent.press(drawn.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(drawn.getByText('That PIN isn’t right.')).toBeTruthy();
    });
    expect(drawn.getByLabelText('PIN')).toHaveDisplayValue('');
    expect(onChosen).not.toHaveBeenCalled();
  });

  it('says why a face was refused on the wall of faces', async () => {
    chosen.mockResolvedValue({ kind: 'refused', reason: 'Valence couldn’t be reached.' });

    const drawn = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Sam' }));

    await waitFor(() => {
      expect(drawn.getByText('Valence couldn’t be reached.')).toBeTruthy();
    });
    expect(drawn.getByText('Who’s watching?')).toBeTruthy();
  });

  describe('a PIN the owner must choose', () => {
    const toTheNewPin = async (onChosen = jest.fn()) => {
      chosen.mockResolvedValueOnce({
        kind: 'needsNewPin',
        reason: 'Others share this account, so your profile needs a PIN.',
      });

      const drawn = await draw(onChosen);

      await userEvent.press(drawn.getByRole('button', { name: 'Sam' }));

      await waitFor(() => {
        expect(drawn.getByText('Choose a PIN')).toBeTruthy();
      });

      return drawn;
    };

    it('asks for one, saying why', async () => {
      const drawn = await toTheNewPin();

      expect(
        drawn.getByText('Others share this account, so your profile needs a PIN.'),
      ).toBeTruthy();
      expect(drawn.getByLabelText('New PIN')).toBeTruthy();
      expect(drawn.getByLabelText('Type the PIN again')).toBeTruthy();
    });

    it('says when the two do not match, and will not send them', async () => {
      const drawn = await toTheNewPin();

      await userEvent.type(drawn.getByLabelText('New PIN'), '1234');
      await userEvent.type(drawn.getByLabelText('Type the PIN again'), '1235');

      expect(drawn.getByText('Those PINs don’t match.')).toBeTruthy();
      expect(drawn.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });

    it('sends the new PIN once both match', async () => {
      const onChosen = jest.fn();
      const drawn = await toTheNewPin(onChosen);

      chosen.mockResolvedValueOnce({ kind: 'chosen', profile: SAM });

      await userEvent.type(drawn.getByLabelText('New PIN'), '2468');
      await userEvent.type(drawn.getByLabelText('Type the PIN again'), '2468');
      await userEvent.press(drawn.getByRole('button', { name: 'Continue' }));

      await waitFor(() => {
        expect(onChosen).toHaveBeenCalled();
      });
      expect(chosen).toHaveBeenLastCalledWith(SAM.id, { newPin: '2468' });
    });
  });

  describe('a forgotten PIN', () => {
    const toForgotten = async (onChosen = jest.fn()) => {
      const drawn = await draw(onChosen);

      await toThePin(drawn);
      await userEvent.press(drawn.getByRole('button', { name: 'Forgot the PIN?' }));

      return drawn;
    };

    it('asks for the account’s password and a new PIN', async () => {
      const drawn = await toForgotten();

      expect(
        drawn.getByText('Enter the account’s password, then choose a new PIN for Dan.'),
      ).toBeTruthy();
      expect(drawn.getByLabelText('Password')).toBeTruthy();
      expect(drawn.getByLabelText('New PIN')).toBeTruthy();
    });

    it('will not send a new PIN without the password', async () => {
      const drawn = await toForgotten();

      await userEvent.type(drawn.getByLabelText('New PIN'), '5678');
      await userEvent.type(drawn.getByLabelText('Type the PIN again'), '5678');

      expect(drawn.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });

    it('sends the password and the new PIN together', async () => {
      chosen.mockResolvedValue({ kind: 'chosen', profile: DAN });

      const onChosen = jest.fn();
      const drawn = await toForgotten(onChosen);

      await userEvent.type(drawn.getByLabelText('Password'), 'hunter2');
      await userEvent.type(drawn.getByLabelText('New PIN'), '5678');
      await userEvent.type(drawn.getByLabelText('Type the PIN again'), '5678');
      await userEvent.press(drawn.getByRole('button', { name: 'Continue' }));

      await waitFor(() => {
        expect(onChosen).toHaveBeenCalled();
      });
      expect(chosen).toHaveBeenCalledWith(DAN.id, { password: 'hunter2', newPin: '5678' });
    });
  });

  it('goes back to the faces when somebody picked the wrong person', async () => {
    const drawn = await draw();

    await toThePin(drawn);
    await userEvent.press(drawn.getByRole('button', { name: 'Someone else' }));

    expect(drawn.getByText('Who’s watching?')).toBeTruthy();
    expect(drawn.queryByLabelText('PIN')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AWhoIsWatching.displayName).toBe('AWhoIsWatching');
  });

  it('lets whoever holds the phone sign out without choosing anybody', async () => {
    const onSignOut = jest.fn();
    const drawn = await draw(jest.fn(), onSignOut);

    await userEvent.press(drawn.getByRole('button', { name: 'Sign out' }));

    expect(onSignOut).toHaveBeenCalled();
    expect(chosen).not.toHaveBeenCalled();
  });
});
