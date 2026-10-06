import { fireEvent, render } from '@testing-library/react-native';
import { Animated, Text } from 'react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { ASwipedTitle } from './ASwipedTitle';

const aTitle = (onWidth = jest.fn()) => (
  <ASwipedTitle
    shift={new Animated.Value(0)}
    previous={<Text>Before</Text>}
    current={<Text>Now</Text>}
    next={<Text>After</Text>}
    onWidth={onWidth}
  />
);

describe('ASwipedTitle', () => {
  it('draws only the song playing until it knows how wide it is', async () => {
    const drawn = await render(aTitle());

    expect(drawn.getByText('Now')).toBeTruthy();
    expect(drawn.queryByText('Before')).toBeNull();
    expect(drawn.queryByText('After')).toBeNull();
  });

  it('lays the songs either side of it a width away, and says how wide that is', async () => {
    const onWidth = jest.fn();
    const drawn = await render(aTitle(onWidth));

    await fireEvent(theDrawnRoot(), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 240, height: 40 } },
    });

    expect(onWidth).toHaveBeenCalledWith(240);
    expect(drawn.getByText('Before').parent?.parent).toHaveStyle({ left: -240, width: 240 });
    expect(drawn.getByText('After').parent?.parent).toHaveStyle({ left: 240, width: 240 });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ASwipedTitle.displayName).toBe('ASwipedTitle');
  });
});
