import { Text } from 'react-native';
import { render, userEvent } from '@testing-library/react-native';
import { AReaderPanel } from './AReaderPanel';

const PLACES = [
  { id: '1', label: 'Chapter one', depth: 0, isHere: true },
  { id: '2', label: 'Chapter two', depth: 0, isHere: false },
];

describe('AReaderPanel', () => {
  it('holds the settings, and lists the places in the book with the one open picked', async () => {
    const drawn = await render(
      <AReaderPanel
        isOpen
        title="Dune"
        placesAre="Contents"
        places={PLACES}
        onPlace={jest.fn()}
        onClose={jest.fn()}
      >
        <Text>Text size</Text>
      </AReaderPanel>,
    );

    expect(drawn.getByText('Text size')).toBeTruthy();
    expect(drawn.getByText('Contents')).toBeTruthy();
    expect(
      drawn.getByRole('button', { name: 'Go to Chapter one' }).props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });
  });

  it('goes to the place picked', async () => {
    const onPlace = jest.fn();
    const drawn = await render(
      <AReaderPanel
        isOpen
        title="Dune"
        placesAre="Contents"
        places={PLACES}
        onPlace={onPlace}
        onClose={jest.fn()}
      >
        <Text>Text size</Text>
      </AReaderPanel>,
    );

    await userEvent.press(drawn.getByText('Chapter two'));

    expect(onPlace).toHaveBeenCalledWith('2');
  });

  it('lists no places for a book with only one', async () => {
    const drawn = await render(
      <AReaderPanel
        isOpen
        title="Dune"
        placesAre="Chapters"
        places={PLACES.slice(0, 1)}
        onPlace={jest.fn()}
        onClose={jest.fn()}
      >
        <Text>Pages turn</Text>
      </AReaderPanel>,
    );

    expect(drawn.queryByText('Chapters')).toBeNull();
  });
});
