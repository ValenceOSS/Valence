import { render, userEvent } from '@testing-library/react-native';
import { TheNotice } from './TheNotice';

describe('TheNotice', () => {
  it('says what the server said, and goes when dismissed', async () => {
    const onDismiss = jest.fn();
    const drawn = await render(
      <TheNotice says="The server is restarting." onDismiss={onDismiss} />,
    );

    expect(drawn.getByText('The server is restarting.')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button'));

    expect(onDismiss).toHaveBeenCalled();
  });
});
