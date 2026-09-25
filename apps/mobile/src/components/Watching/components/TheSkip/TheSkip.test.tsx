import { render, userEvent } from '@testing-library/react-native';
import { TheSkip } from './TheSkip';

describe('TheSkip', () => {
  it('says what it would skip, since a recap and credits are not the same offer', async () => {
    const drawn = await render(<TheSkip says="Skip Recap" onSkip={jest.fn()} />);

    expect(drawn.getByText('Skip Recap')).toBeTruthy();
  });

  it('goes past it when pressed', async () => {
    const onSkip = jest.fn();
    const drawn = await render(<TheSkip says="Skip Intro" onSkip={onSkip} />);

    await userEvent.press(drawn.getByLabelText('Skip Intro'));

    expect(onSkip).toHaveBeenCalled();
  });
});
