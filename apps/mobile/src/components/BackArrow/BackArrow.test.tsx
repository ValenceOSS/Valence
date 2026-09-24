import { render, userEvent } from '@testing-library/react-native';
import { BackArrow } from './BackArrow';

describe('BackArrow', () => {
  it('goes back when pressed', async () => {
    const onBack = jest.fn();
    const drawn = await render(<BackArrow onBack={onBack} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalled();
  });

  it('says close, pointing down, on a page that rose from below', async () => {
    const drawn = await render(<BackArrow onBack={jest.fn()} pointsDown />);

    expect(drawn.getByRole('button', { name: 'Close' })).toBeTruthy();
  });
});
