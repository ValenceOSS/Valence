import { act, render } from '@testing-library/react-native';
import { VolumeIndicator } from '@ValenceTv/screens/Player/components/VolumeIndicator/VolumeIndicator';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('VolumeIndicator', () => {
  it('shows how loud the film plays once it is turned', async () => {
    const drawn = await render(<VolumeIndicator level={0.4} isShown />);

    expect(drawn.getByLabelText('Volume').props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 40,
    });
  });

  it('shows nothing until the volume is turned', async () => {
    const drawn = await render(<VolumeIndicator level={1} isShown={false} />);

    expect(drawn.queryByLabelText('Volume')).toBeNull();
  });

  it('goes away once it has been seen', async () => {
    const drawn = await render(<VolumeIndicator level={0.4} isShown />);

    await drawn.rerender(<VolumeIndicator level={0.4} isShown={false} />);

    await act(async () => {
      jest.advanceTimersByTime(1_000);
      await Promise.resolve();
    });

    expect(drawn.queryByLabelText('Volume')).toBeNull();
  });
});
