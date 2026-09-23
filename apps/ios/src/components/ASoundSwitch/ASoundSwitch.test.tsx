import { render, userEvent } from '@testing-library/react-native';
import { ASoundSwitch } from './ASoundSwitch';

describe('ASoundSwitch', () => {
  it('turns the sound on where it is off', async () => {
    const onToggle = jest.fn();
    const drawn = await render(<ASoundSwitch isMuted onToggle={onToggle} />);

    await userEvent.press(drawn.getByRole('button'));

    expect(onToggle).toHaveBeenCalled();
  });

  it('says what pressing it will do', async () => {
    const muted = await render(<ASoundSwitch isMuted onToggle={jest.fn()} />);
    const audible = await render(<ASoundSwitch isMuted={false} onToggle={jest.fn()} />);

    expect(muted.getByRole('button').props.accessibilityLabel).not.toBe(
      audible.getByRole('button').props.accessibilityLabel,
    );
  });
});
