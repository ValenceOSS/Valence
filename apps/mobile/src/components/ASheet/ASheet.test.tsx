import { Text } from 'react-native';
import { useContext } from 'react';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { SHEET_HOLD } from './SHEET_HOLD';
import { ASheet } from './ASheet';

describe('ASheet', () => {
  it('says what it is for, holds its contents, and goes when put away', async () => {
    const onClose = jest.fn();
    const drawn = await render(
      <ASheet isOpen title="Play on" onClose={onClose}>
        <Text>Living room</Text>
      </ASheet>,
    );

    expect(drawn.getByText('Play on')).toBeTruthy();
    expect(drawn.getByText('Living room')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Done' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('keeps what it holds still where it all fits, where it is asked to be steady', async () => {
    const drawn = await render(
      <ASheet isOpen title="Profile picture" isSteady onClose={jest.fn()}>
        <Text>Photo</Text>
      </ASheet>,
    );

    const steady = drawn.root?.queryAll((node) => node.props.alwaysBounceVertical === false) ?? [];
    const bouncy = drawn.root?.queryAll((node) => node.props.alwaysBounceVertical === true) ?? [];

    expect(steady.length).toBeGreaterThan(0);
    expect(bouncy).toHaveLength(0);
  });

  it('stops scrolling while something in it holds it, and scrolls again once let go', async () => {
    const Holder = () => {
      const hold = useContext(SHEET_HOLD);

      return (
        <Text
          onPress={() => {
            hold?.(true);
          }}
          onLongPress={() => {
            hold?.(false);
          }}
        >
          Picture
        </Text>
      );
    };
    const drawn = await render(
      <ASheet isOpen title="Profile picture" onClose={jest.fn()}>
        <Holder />
      </ASheet>,
    );
    const scrolling = () =>
      drawn.root?.queryAll((node) => node.props.scrollEnabled === false) ?? [];

    expect(scrolling()).toHaveLength(0);

    await fireEvent.press(drawn.getByText('Picture'));

    expect(scrolling().length).toBeGreaterThan(0);

    await fireEvent(drawn.getByText('Picture'), 'longPress');

    expect(scrolling()).toHaveLength(0);
  });

  it('says what putting it away does, where it is not simply done', async () => {
    const drawn = await render(
      <ASheet isOpen title="New playlist" closeLabel="Cancel" onClose={jest.fn()}>
        <Text>Name</Text>
      </ASheet>,
    );

    expect(drawn.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });
});
