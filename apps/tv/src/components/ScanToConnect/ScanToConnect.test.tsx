import { render, userEvent } from '@testing-library/react-native';
import { ScanToConnect } from './ScanToConnect';

describe('ScanToConnect', () => {
  it('shows a code to scan, and says when somebody is done', async () => {
    const onDone = jest.fn();
    const drawn = await render(
      <ScanToConnect
        address="http://192.168.1.20:3000/api/plugins/x/connect?ticket=abc"
        onDone={onDone}
      />,
    );

    expect(drawn.getByLabelText('A QR code to scan with your phone’s camera')).toBeTruthy();
    expect(drawn.getByText('Sign in on your phone')).toBeTruthy();

    await userEvent.press(drawn.getByText('Done'));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
