import { act, render } from '@testing-library/react-native';
import { ARing } from './ARing';

describe('ARing', () => {
  it('is drawn the size it is asked for', async () => {
    const drawn = await render(<ARing colour="#ffffff" size={50} label="Loading" />);

    expect(drawn.getByLabelText('Loading').props.style).toMatchObject({ height: 50, width: 50 });
  });

  it('says once it is whole after being told the wait is over', async () => {
    jest.useFakeTimers();
    const onFilled = jest.fn();

    await render(<ARing colour="#ffffff" isFinishing onFilled={onFilled} />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });

    expect(onFilled).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
