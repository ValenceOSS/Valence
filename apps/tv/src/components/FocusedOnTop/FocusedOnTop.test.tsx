import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FocusedOnTop } from '@ValenceTv/components/FocusedOnTop/FocusedOnTop';

const aCard = () => (
  <FocusedOnTop style={{ width: 420 }}>
    <Text>Arrival</Text>
  </FocusedOnTop>
);

describe('FocusedOnTop', () => {
  it('sits among its neighbours while the remote is elsewhere', async () => {
    const drawn = await render(aCard());

    expect(drawn.getByText('Arrival').parent).not.toHaveStyle({ zIndex: 1 });
  });

  it('draws above them while the remote is on what it holds, and goes back as it leaves', async () => {
    const drawn = await render(aCard());

    await fireEvent(drawn.getByText('Arrival'), 'focus');
    expect(drawn.getByText('Arrival').parent).toHaveStyle({ zIndex: 1 });

    await fireEvent(drawn.getByText('Arrival'), 'blur');
    expect(drawn.getByText('Arrival').parent).not.toHaveStyle({ zIndex: 1 });
  });

  it('keeps the layout it is given, and tells the list where it went', async () => {
    const onLayout = jest.fn();
    const drawn = await render(
      <FocusedOnTop style={{ width: 420 }} onLayout={onLayout}>
        <Text>Arrival</Text>
      </FocusedOnTop>,
    );
    const holder = drawn.getByText('Arrival').parent;

    expect(holder).toHaveStyle({ width: 420 });

    if (holder !== null) {
      await fireEvent(holder, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 420, height: 236 } },
      });
    }

    expect(onLayout).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FocusedOnTop.displayName).toBe('FocusedOnTop');
  });
});
