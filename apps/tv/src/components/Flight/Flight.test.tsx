import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { Flight } from '@ValenceTv/components/Flight/Flight';

const FROM = { x: 100, y: 200, width: 160, height: 160 };

const TO = { x: 1700, y: 40, width: 80, height: 80 };

describe('Flight', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('draws what flies where it starts from', async () => {
    const drawn = await render(
      <Flight from={FROM} to={null} onLanded={jest.fn()}>
        <Text>M</Text>
      </Flight>,
    );

    expect(drawn.getByText('M')).toBeTruthy();
    expect(drawn.toJSON()).toHaveStyle({ position: 'absolute', left: 100, top: 200 });
  });

  it('says it has landed once it reaches where it is going', async () => {
    const onLanded = jest.fn();
    const drawn = await render(
      <Flight from={FROM} to={null} onLanded={onLanded}>
        <Text>M</Text>
      </Flight>,
    );

    await drawn.rerender(
      <Flight from={FROM} to={TO} onLanded={onLanded}>
        <Text>M</Text>
      </Flight>,
    );

    expect(onLanded).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onLanded).toHaveBeenCalledTimes(1);
  });

  it('gives up after a moment where nowhere is ever said', async () => {
    const onLanded = jest.fn();

    await render(
      <Flight from={FROM} to={null} onLanded={onLanded}>
        <Text>M</Text>
      </Flight>,
    );

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onLanded).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onLanded).toHaveBeenCalledTimes(1);
  });

  it('does not give up once it is told where to go', async () => {
    const onLanded = jest.fn();
    const drawn = await render(
      <Flight from={FROM} to={null} onLanded={onLanded}>
        <Text>M</Text>
      </Flight>,
    );

    await drawn.rerender(
      <Flight from={FROM} to={TO} onLanded={onLanded}>
        <Text>M</Text>
      </Flight>,
    );

    await act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(onLanded).toHaveBeenCalledTimes(1);
  });
});
