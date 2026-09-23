import { render, userEvent, waitFor } from '@testing-library/react-native';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { isAValence } from '@ValenceTv/native/isAValence';
import { ChooseServer } from '@ValenceTv/screens/ChooseServer/ChooseServer';
import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';

let mockHeard: NearbyValence[] = [];

jest.mock('@ValenceTv/native/listenForValences', () => ({
  listenForValences: (onChange: (nearby: NearbyValence[]) => void) => {
    onChange(mockHeard);

    return () => undefined;
  },
}));

jest.mock('@ValenceTv/native/isAValence', () => ({ isAValence: jest.fn() }));

beforeEach(() => {
  mockHeard = [];
  jest.mocked(isAValence).mockReset();
  jest.mocked(isAValence).mockResolvedValue(true);
});

describe('ChooseServer', () => {
  it('asks which Valence this is and keeps looking while it has heard of none', async () => {
    const drawn = await render(<ChooseServer onChosen={jest.fn()} />);

    expect(drawn.getByText('Which Valence is yours?')).toBeTruthy();
    expect(drawn.getByText('Looking on your network…')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Another address, Type it in' })).toBeTruthy();
  });

  it('offers what it heard on the network and chooses it at once', async () => {
    mockHeard = [
      { name: 'Living room', address: 'http://192.168.1.10:8420' },
      { name: 'Loft', address: 'http://192.168.1.11:8420' },
    ];
    const onChosen = jest.fn();
    const drawn = await render(<ChooseServer onChosen={onChosen} />);

    expect(drawn.getByText('Found 2 on your network')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Living room, 192.168.1.10:8420' }));

    expect(onChosen).toHaveBeenCalledWith('http://192.168.1.10:8420');
    expect(isAValence).not.toHaveBeenCalled();
  });

  it('says when it found one Valence', async () => {
    mockHeard = [{ name: 'Living room', address: 'http://192.168.1.10:8420' }];
    const drawn = await render(<ChooseServer onChosen={jest.fn()} />);

    expect(drawn.getByText('Found 1 Valence on your network')).toBeTruthy();
  });

  it('asks a server used before whether it is there before choosing it', async () => {
    rememberServerAddress('http://old.local:8420');
    const onChosen = jest.fn();
    const drawn = await render(<ChooseServer onChosen={onChosen} />);

    await userEvent.press(drawn.getByRole('button', { name: 'old.local:8420, Used before' }));

    expect(isAValence).toHaveBeenCalledWith('http://old.local:8420');
    await waitFor(() => {
      expect(onChosen).toHaveBeenCalledWith('http://old.local:8420');
    });
  });

  it('says so when nothing answers at a server used before', async () => {
    jest.mocked(isAValence).mockResolvedValue(false);
    rememberServerAddress('http://old.local:8420');
    const onChosen = jest.fn();
    const drawn = await render(<ChooseServer onChosen={onChosen} />);

    await userEvent.press(drawn.getByRole('button', { name: 'old.local:8420, Used before' }));

    expect(
      await drawn.findByText(
        'Nothing answered at http://old.local:8420. Check the address and that Valence is running.',
      ),
    ).toBeTruthy();
    expect(onChosen).not.toHaveBeenCalled();
  });

  it('connects to an address typed in', async () => {
    const onChosen = jest.fn();
    const drawn = await render(<ChooseServer onChosen={onChosen} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Another address, Type it in' }));
    await userEvent.type(drawn.getByPlaceholderText('192.168.1.10:8420'), 'valence.home');
    await userEvent.press(drawn.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(onChosen).toHaveBeenCalledWith('https://valence.home');
    });
  });

  it('says what is wrong with an address that cannot be one', async () => {
    const drawn = await render(<ChooseServer onChosen={jest.fn()} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Another address, Type it in' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Connect' }));

    expect(drawn.getByText('Enter the address of your Valence server.')).toBeTruthy();
    expect(isAValence).not.toHaveBeenCalled();
  });

  it('goes back to the row of servers from typing', async () => {
    const drawn = await render(<ChooseServer onChosen={jest.fn()} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Another address, Type it in' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Back' }));

    expect(drawn.getByRole('button', { name: 'Another address, Type it in' })).toBeTruthy();
  });

  it('starts at the box, with the address that stopped answering, where nothing was used before', async () => {
    const drawn = await render(
      <ChooseServer onChosen={jest.fn()} couldNotReach="http://gone.local:8420" />,
    );

    expect(drawn.getByText('Valence at http://gone.local:8420 could not be reached.')).toBeTruthy();
    expect(drawn.getByDisplayValue('http://gone.local:8420')).toBeTruthy();
  });
});
