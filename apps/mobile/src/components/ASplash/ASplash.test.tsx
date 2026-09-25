import { act, render } from '@testing-library/react-native';
import { ASplash } from './ASplash';

describe('ASplash', () => {
  it('shows the mark while the first screen is got ready', async () => {
    const drawn = await render(<ASplash isDone={false} onGone={jest.fn()} />);

    expect(drawn.getByLabelText('Valence')).toBeTruthy();
  });

  it('says it has gone once it has faded, after being told the screen is ready', async () => {
    jest.useFakeTimers();
    const onGone = jest.fn();

    await render(<ASplash isDone onGone={onGone} />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(600);
    });

    expect(onGone).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
