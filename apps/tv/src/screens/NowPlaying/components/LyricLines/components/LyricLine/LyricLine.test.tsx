import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { LyricLine } from '@ValenceTv/screens/NowPlaying/components/LyricLines/components/LyricLine/LyricLine';

const aLine = (
  change: Partial<{
    distance: number;
    canSeek: boolean;
    onPress: () => void;
    onFocus: () => void;
    onLayout: (top: number, height: number) => void;
  }> = {},
) => (
  <LyricLine
    text="Take me back to Eden"
    distance={change.distance ?? 0}
    canSeek={change.canSeek ?? true}
    onPress={change.onPress ?? jest.fn()}
    onFocus={change.onFocus ?? jest.fn()}
    onLayout={change.onLayout ?? jest.fn()}
  />
);

describe('LyricLine', () => {
  it('shows its words as something the remote can land on', async () => {
    const drawn = await render(aLine());

    expect(drawn.getByRole('button', { name: 'Take me back to Eden' })).toBeTruthy();
    expect(drawn.getByText('Take me back to Eden')).toBeTruthy();
  });

  it('is lit fully while it is sung', async () => {
    const drawn = await render(aLine({ distance: 0 }));

    expect(drawn.getByText('Take me back to Eden')).toHaveStyle({ opacity: 1 });
  });

  it('keeps the next line brighter than the one just gone', async () => {
    const next = await render(aLine({ distance: 1 }));

    expect(next.getByText('Take me back to Eden')).toHaveStyle({ opacity: 0.62 });

    const gone = await render(aLine({ distance: -1 }));

    expect(gone.getByText('Take me back to Eden')).toHaveStyle({ opacity: 0.4 });
  });

  it('dims further the further a line is from the sung one', async () => {
    const two = await render(aLine({ distance: 2 }));

    expect(two.getByText('Take me back to Eden')).toHaveStyle({ opacity: 0.52 });

    const three = await render(aLine({ distance: 3 }));

    expect(three.getByText('Take me back to Eden')).toHaveStyle({ opacity: 0.42 });
  });

  it('never fades a far line out altogether', async () => {
    const drawn = await render(aLine({ distance: -10 }));

    expect(drawn.getByText('Take me back to Eden')).toHaveStyle({ opacity: 0.12 });
  });

  it('goes to where it is sung when pressed, if the words are timed', async () => {
    const onPress = jest.fn();
    const drawn = await render(aLine({ onPress }));

    await userEvent.press(drawn.getByRole('button', { name: 'Take me back to Eden' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does nothing when pressed if the words are not timed', async () => {
    const onPress = jest.fn();
    const drawn = await render(aLine({ canSeek: false, onPress }));

    await userEvent.press(drawn.getByRole('button', { name: 'Take me back to Eden' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('says when the remote lands on it, and shows it in full and underlined', async () => {
    const onFocus = jest.fn();
    const drawn = await render(aLine({ distance: 4, onFocus }));

    await fireEvent(drawn.getByRole('button', { name: 'Take me back to Eden' }), 'focus');

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(drawn.getByText('Take me back to Eden')).toHaveStyle({
      opacity: 1,
      textDecorationLine: 'underline',
    });
  });

  it('says where it sits in the column and how tall it is', async () => {
    const onLayout = jest.fn();
    const drawn = await render(aLine({ onLayout }));
    const [line] = drawn.container.queryAll(
      (node) => node.type === 'View' && node.props.collapsable === false,
    );

    if (line === undefined) {
      throw new Error('The line was not drawn.');
    }

    await fireEvent(line, 'layout', {
      nativeEvent: { layout: { x: 0, y: 140, width: 900, height: 70 } },
    });

    expect(onLayout).toHaveBeenCalledWith(140, 70);
  });
});
