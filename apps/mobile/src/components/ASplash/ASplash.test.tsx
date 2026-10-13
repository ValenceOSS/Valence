import { act, render } from '@testing-library/react-native';
import { ASplash } from './ASplash';

describe('ASplash', () => {
  it('shows the mark while the first screen is got ready', async () => {
    const drawn = await render(<ASplash isReady={false} isDark onGone={jest.fn()} />);

    expect(drawn.getByLabelText('Valence')).toBeTruthy();
  });

  it('says it has gone once everything has arrived and it has left, after the screen is ready', async () => {
    jest.useFakeTimers();
    const onGone = jest.fn();

    await render(<ASplash isReady isDark={false} onGone={onGone} />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(4000);
    });

    expect(onGone).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
