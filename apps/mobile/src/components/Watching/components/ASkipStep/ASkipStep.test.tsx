import { render, userEvent } from '@testing-library/react-native';
import { ASkipStep } from './ASkipStep';

describe('ASkipStep', () => {
  it('jumps back by as much as it says', async () => {
    const onSkip = jest.fn();
    const drawn = await render(<ASkipStep by={-10} onSkip={onSkip} />);

    expect(drawn.getByText('10')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('Back 10 seconds'));

    expect(onSkip).toHaveBeenCalledWith(-10);
  });

  it('jumps on by as much as it says', async () => {
    const onSkip = jest.fn();
    const drawn = await render(<ASkipStep by={30} onSkip={onSkip} />);

    await userEvent.press(drawn.getByLabelText('Forward 30 seconds'));

    expect(onSkip).toHaveBeenCalledWith(30);
  });
});
