import { fireEvent, render } from '@testing-library/react-native';
import { Animated, Text } from 'react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AMarquee } from './AMarquee';

describe('AMarquee', () => {
  it('draws what it holds on one line that cannot be scrolled by hand', async () => {
    const drawn = await render(
      <AMarquee>
        <Text>A very long song name</Text>
      </AMarquee>,
    );

    expect(drawn.getByText('A very long song name')).toBeTruthy();
    expect(theDrawnRoot()).toHaveProp('scrollEnabled', false);
    expect(theDrawnRoot()).toHaveProp('horizontal', true);
  });

  it('slides along only where what it holds is wider than the room it has', async () => {
    const loop = jest.spyOn(Animated, 'loop');

    await render(
      <AMarquee>
        <Text>Short</Text>
      </AMarquee>,
    );

    await fireEvent(theDrawnRoot(), 'layout', { nativeEvent: { layout: { width: 200 } } });
    await fireEvent(theDrawnRoot(), 'contentSizeChange', 100, 20);

    expect(loop).not.toHaveBeenCalled();

    await fireEvent(theDrawnRoot(), 'contentSizeChange', 320, 20);

    expect(loop).toHaveBeenCalled();
    loop.mockRestore();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AMarquee.displayName).toBe('AMarquee');
  });
});
