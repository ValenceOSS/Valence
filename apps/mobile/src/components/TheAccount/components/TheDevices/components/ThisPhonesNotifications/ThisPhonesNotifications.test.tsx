import { render } from '@testing-library/react-native';
import { useWakingThisPhone } from '@ValenceMobile/push/useWakingThisPhone';
import { ThisPhonesNotifications } from './ThisPhonesNotifications';

jest.mock('@ValenceMobile/push/useWakingThisPhone', () => ({ useWakingThisPhone: jest.fn() }));

const WAKING = { isOffered: true, isOn: false, turnOn: jest.fn(), turnOff: jest.fn() };

describe('ThisPhonesNotifications', () => {
  it('offers a switch where the server wakes phones', async () => {
    jest.mocked(useWakingThisPhone).mockReturnValue(WAKING);

    const drawn = await render(<ThisPhonesNotifications />);

    expect(drawn.getByRole('switch', { name: 'Notifications on this phone' })).toBeTruthy();
  });

  it('says the server has not turned them on, rather than a switch that does nothing', async () => {
    jest.mocked(useWakingThisPhone).mockReturnValue({ ...WAKING, isOffered: false });

    const drawn = await render(<ThisPhonesNotifications />);

    expect(drawn.queryByRole('switch')).toBeNull();
    expect(
      drawn.getByText('Your server’s administrator hasn’t turned on phone notifications'),
    ).toBeTruthy();
  });
});
