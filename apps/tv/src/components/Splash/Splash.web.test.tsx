import { render } from '@testing-library/react';
import { Animated } from 'react-native';
import { Splash } from '@ValenceTv/components/Splash/Splash';

describe('Splash in a browser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('neither breathes nor fades, and is gone the moment the app is ready', () => {
    const loop = jest.spyOn(Animated, 'loop');
    const timing = jest.spyOn(Animated, 'timing');
    const onGone = jest.fn();
    const drawn = render(<Splash isDone={false} onGone={onGone} />);

    expect(onGone).not.toHaveBeenCalled();

    drawn.rerender(<Splash isDone onGone={onGone} />);

    expect(onGone).toHaveBeenCalledTimes(1);
    expect(loop).not.toHaveBeenCalled();
    expect(timing).not.toHaveBeenCalled();
  });
});
