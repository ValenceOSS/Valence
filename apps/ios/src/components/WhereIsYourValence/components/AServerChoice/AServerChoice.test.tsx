import { render, userEvent } from '@testing-library/react-native';
import { AServerChoice } from './AServerChoice';

describe('AServerChoice', () => {
  it('names a server found nearby, and picks its address when pressed', async () => {
    const onChoose = jest.fn();
    const drawn = await render(
      <AServerChoice name="Home" address="http://192.168.1.2:8420" onChoose={onChoose} />,
    );

    expect(drawn.getByText('Home')).toBeTruthy();

    await userEvent.press(drawn.getByText('Home'));

    expect(onChoose).toHaveBeenCalledWith('http://192.168.1.2:8420');
  });
});
