import { render, userEvent, waitFor } from '@testing-library/react-native';
import { chooseProfile } from '@ValenceClient/profiles/chooseProfile';
import { ChooseProfile } from '@ValenceTv/screens/ChooseProfile/ChooseProfile';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';

jest.mock('@ValenceClient/profiles/chooseProfile', () => ({ chooseProfile: jest.fn() }));

const chosen = jest.mocked(chooseProfile);

const aProfile = (
  id: string,
  name: string,
  overrides: Partial<ViewerProfile> = {},
): ViewerProfile => ({
  id,
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
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

const JO = aProfile('00000000-0000-4000-8000-000000000001', 'Jo', { isOwner: true, hasPin: true });

const SAM = aProfile('00000000-0000-4000-8000-000000000002', 'Sam');

const draw = (onChosen = jest.fn(), onSignOut = jest.fn()) =>
  render(
    <ChooseProfile
      profiles={[JO, SAM]}
      onChosen={onChosen}
      onSignOut={onSignOut}
      isArriving={false}
      onFaceAt={jest.fn()}
      onMarkAt={jest.fn()}
    />,
  );

type Drawn = Awaited<ReturnType<typeof draw>>;

const typeInto = async (field: string, words: string, drawn: Drawn) => {
  const [, box] = drawn.getAllByLabelText(field);

  if (box !== undefined) {
    await userEvent.type(box, words);
  }
};

const toThePin = async (drawn: Drawn) => {
  await userEvent.press(drawn.getByRole('button', { name: 'Jo' }));
};

beforeEach(() => {
  chosen.mockReset();
});

describe('ChooseProfile', () => {
  it('asks who is watching and shows a face for everybody on the account', async () => {
    const drawn = await draw();

    expect(drawn.getByText('Who’s watching?')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Jo' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Sam' })).toBeTruthy();
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

    expect(drawn.getByText('Jo')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'PIN' })).toBeTruthy();
    expect(chosen).not.toHaveBeenCalled();
  });

  it('will not send a PIN shorter than four digits', async () => {
    const drawn = await draw();

    await toThePin(drawn);
    await typeInto('PIN', '123', drawn);

    expect(drawn.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('sends the PIN typed, and lets the profile in once it is right', async () => {
    chosen.mockResolvedValue({ kind: 'chosen', profile: JO });

    const onChosen = jest.fn();
    const drawn = await draw(onChosen);

    await toThePin(drawn);
    await typeInto('PIN', '1234', drawn);
    await userEvent.press(drawn.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onChosen).toHaveBeenCalled();
    });
    expect(chosen).toHaveBeenCalledWith(JO.id, { pin: '1234' });
  });

  it('says the PIN was wrong and holds the profile in for another go', async () => {
    chosen.mockResolvedValue({ kind: 'needsPin', reason: 'That PIN isn’t right.' });

    const onChosen = jest.fn();
    const drawn = await draw(onChosen);

    await toThePin(drawn);
    await typeInto('PIN', '9999', drawn);
    await userEvent.press(drawn.getByRole('button', { name: 'Continue' }));

    expect(await drawn.findByText('That PIN isn’t right.')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Continue' })).toBeDisabled();
    expect(onChosen).not.toHaveBeenCalled();
  });

  it('starts the PIN afresh after a wrong one, rather than adding to it', async () => {
    chosen
      .mockResolvedValueOnce({ kind: 'needsPin', reason: 'That PIN isn’t right.' })
      .mockResolvedValueOnce({ kind: 'chosen', profile: JO });

    const drawn = await draw();

    await toThePin(drawn);
    await typeInto('PIN', '9999', drawn);
    await userEvent.press(drawn.getByRole('button', { name: 'Continue' }));
    await drawn.findByText('That PIN isn’t right.');
    await typeInto('PIN', '1234', drawn);
    await userEvent.press(drawn.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(chosen).toHaveBeenLastCalledWith(JO.id, { pin: '1234' });
    });
  });

  it('says why a face was refused on the row of faces', async () => {
    chosen.mockResolvedValue({ kind: 'refused', reason: 'Valence couldn’t be reached.' });

    const drawn = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Sam' }));

    expect(await drawn.findByText('Valence couldn’t be reached.')).toBeTruthy();
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
      await drawn.findByText('Choose a PIN');

      return drawn;
    };

    it('asks for one, saying why', async () => {
      const drawn = await toTheNewPin();

      expect(
        drawn.getByText('Others share this account, so your profile needs a PIN.'),
      ).toBeTruthy();
      expect(drawn.getByRole('button', { name: 'New PIN' })).toBeTruthy();
      expect(drawn.getByRole('button', { name: 'Type the PIN again' })).toBeTruthy();
    });

    it('says when the two do not match, and will not send them', async () => {
      const drawn = await toTheNewPin();

      await typeInto('New PIN', '1234', drawn);
      await typeInto('Type the PIN again', '1235', drawn);

      expect(drawn.getByText('Those PINs don’t match.')).toBeTruthy();
      expect(drawn.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });

    it('sends the new PIN once both match', async () => {
      const onChosen = jest.fn();
      const drawn = await toTheNewPin(onChosen);

      chosen.mockResolvedValueOnce({ kind: 'chosen', profile: SAM });

      await typeInto('New PIN', '2468', drawn);
      await typeInto('Type the PIN again', '2468', drawn);
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
        drawn.getByText('Enter the account’s password, then choose a new PIN for Jo.'),
      ).toBeTruthy();
      expect(drawn.getByRole('button', { name: 'Password' })).toBeTruthy();
      expect(drawn.getByRole('button', { name: 'New PIN' })).toBeTruthy();
    });

    it('will not send a new PIN without the password', async () => {
      const drawn = await toForgotten();

      await typeInto('New PIN', '5678', drawn);
      await typeInto('Type the PIN again', '5678', drawn);

      expect(drawn.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });

    it('sends the password and the new PIN together', async () => {
      chosen.mockResolvedValue({ kind: 'chosen', profile: JO });

      const onChosen = jest.fn();
      const drawn = await toForgotten(onChosen);

      await typeInto('Password', 'hunter2', drawn);
      await typeInto('New PIN', '5678', drawn);
      await typeInto('Type the PIN again', '5678', drawn);
      await userEvent.press(drawn.getByRole('button', { name: 'Continue' }));

      await waitFor(() => {
        expect(onChosen).toHaveBeenCalled();
      });
      expect(chosen).toHaveBeenCalledWith(JO.id, { password: 'hunter2', newPin: '5678' });
    });
  });

  it('goes back to the faces when somebody picked the wrong person', async () => {
    const drawn = await draw();

    await toThePin(drawn);
    await userEvent.press(drawn.getByRole('button', { name: 'Someone else' }));

    expect(drawn.getByText('Who’s watching?')).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'PIN' })).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ChooseProfile.displayName).toBe('ChooseProfile');
  });

  it('lets whoever holds the remote sign out without choosing anybody', async () => {
    const onSignOut = jest.fn();
    const drawn = await draw(jest.fn(), onSignOut);

    await userEvent.press(drawn.getByRole('button', { name: 'Sign out' }));

    expect(onSignOut).toHaveBeenCalled();
    expect(chosen).not.toHaveBeenCalled();
  });
});
