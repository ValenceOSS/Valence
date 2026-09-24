import { render, userEvent } from '@testing-library/react-native';
import { useTheServer } from '@ValenceMobile/hooks/useTheServer';
import { TheServerIsAway } from './TheServerIsAway';

jest.mock('@ValenceMobile/hooks/useTheServer');

describe('TheServerIsAway', () => {
  it('says nothing while the server answers', async () => {
    jest
      .mocked(useTheServer)
      .mockReturnValue({ address: 'one.local', isAway: false, tryNow: jest.fn() });

    const drawn = await render(<TheServerIsAway />);

    expect(drawn.toJSON()).toBeNull();
  });

  it('says the server cannot be reached, and tries again when asked', async () => {
    const tryNow = jest.fn();

    jest.mocked(useTheServer).mockReturnValue({ address: 'one.local', isAway: true, tryNow });

    const drawn = await render(<TheServerIsAway />);

    expect(drawn.getByText('Can’t reach one.local')).toBeTruthy();

    await userEvent.press(drawn.getByText('Try now'));

    expect(tryNow).toHaveBeenCalled();
  });
});
