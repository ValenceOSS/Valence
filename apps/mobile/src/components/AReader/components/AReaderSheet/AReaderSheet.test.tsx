import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Section, Text } from '@expo/ui/swift-ui';
import { AReaderSheet } from './AReaderSheet';
import type { AReaderSheetProps } from './AReaderSheet.types';

const PLACES = [
  { id: 'one', label: 'Chapter one', depth: 0, isHere: true },
  { id: 'two', label: 'Chapter two', depth: 1, isHere: false },
];

const A_BOOKMARK = {
  id: 'a',
  place: 'Page 3',
  chapter: 'Chapter two',
  excerpt: null,
  picture: null,
};

/**
 * A sheet with everything a reader hands it, and whatever a test changes.
 *
 * @param overrides - What the test changes.
 * @returns The sheet.
 */
const aSheet = (overrides: Partial<AReaderSheetProps> = {}) => (
  <AReaderSheet
    isOpen
    onClose={jest.fn()}
    title="Dune"
    settings={
      <Section title="The reader's own">
        <Text>A setting</Text>
      </Section>
    }
    placesAre="Chapters"
    places={PLACES}
    onPlace={jest.fn()}
    {...overrides}
  />
);

/**
 * Every native view drawn that matches.
 *
 * @param found - What to look for.
 * @returns The views.
 */
const everyHostWith = (found: Parameters<typeof screen.container.queryAll>[0]) =>
  screen.container.queryAll(found);

/**
 * The first native view drawn that matches.
 *
 * @param found - What to look for.
 * @returns The view.
 */
const theHostWith = (found: Parameters<typeof screen.container.queryAll>[0]) => {
  const [one] = everyHostWith(found);

  if (one === undefined) {
    throw new Error('Nothing like that was drawn.');
  }

  return one;
};

describe('AReaderSheet', () => {
  it('rises when open', async () => {
    await render(aSheet());

    expect(theHostWith((one) => 'isPresented' in one.props)).toHaveProp('isPresented', true);
  });

  it('says it was put away when pulled down, and when Done is pressed', async () => {
    const onClose = jest.fn();

    await render(aSheet({ onClose }));
    await fireEvent(
      theHostWith((one) => 'isPresented' in one.props),
      'isPresentedChange',
      {
        nativeEvent: { isPresented: false },
      },
    );

    expect(onClose).toHaveBeenCalledTimes(1);

    await fireEvent(
      theHostWith((one) => one.props.label === 'Done'),
      'buttonPress',
    );

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('does not say it was put away when it rises', async () => {
    const onClose = jest.fn();

    await render(aSheet({ onClose }));
    await fireEvent(
      theHostWith((one) => 'isPresented' in one.props),
      'isPresentedChange',
      {
        nativeEvent: { isPresented: true },
      },
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  it("draws the reader's look and its own settings", async () => {
    await render(
      aSheet({
        look: (
          <Section title="The look">
            <Text>Themes</Text>
          </Section>
        ),
      }),
    );

    expect(theHostWith((one) => one.props.title === 'The look')).toBeTruthy();
    expect(theHostWith((one) => one.props.title === "The reader's own")).toBeTruthy();
  });

  it('lists the places, ticking the open one, and goes to the one pressed', async () => {
    const onPlace = jest.fn();

    await render(aSheet({ onPlace }));

    expect(theHostWith((one) => one.props.title === 'Chapters')).toBeTruthy();
    expect(everyHostWith((one) => one.props.systemName === 'checkmark')).toHaveLength(1);

    await fireEvent(
      theHostWith((one) => one.props.text === 'Chapter two'),
      'buttonPress',
    );

    expect(onPlace).toHaveBeenCalledWith('two');
  });

  it('leaves the places out where there is only one', async () => {
    await render(aSheet({ places: PLACES.slice(0, 1) }));

    expect(everyHostWith((one) => one.props.title === 'Chapters')).toHaveLength(0);
  });

  it('leaves bookmarks out where the book keeps none', async () => {
    await render(aSheet());

    expect(everyHostWith((one) => one.props.text === 'Bookmarks')).toHaveLength(0);
  });

  it('leads to the bookmarks with how many there are', async () => {
    await render(aSheet({ bookmarks: [A_BOOKMARK] }));

    expect(theHostWith((one) => one.props.text === 'Bookmarks')).toBeTruthy();
    expect(theHostWith((one) => one.props.text === '1')).toBeTruthy();
  });

  it('puts itself away before going to a bookmark, once it has slid down', async () => {
    jest.useFakeTimers();

    const onClose = jest.fn();
    const onBookmark = jest.fn();

    await render(aSheet({ onClose, onBookmark, bookmarks: [A_BOOKMARK] }));
    await fireEvent(
      theHostWith((one) => one.props.text === 'Page 3'),
      'buttonPress',
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onBookmark).not.toHaveBeenCalled();

    await act(() => {
      jest.runAllTimers();
    });

    expect(onBookmark).toHaveBeenCalledWith('a');
    jest.useRealTimers();
  });

  it('passes on the bookmarks removed on their page', async () => {
    const onRemoveBookmarks = jest.fn();

    await render(aSheet({ onRemoveBookmarks, bookmarks: [A_BOOKMARK] }));
    await fireEvent(
      theHostWith((one) => one.props.deleteEnabled === true),
      'delete',
      {
        nativeEvent: { indices: [0] },
      },
    );

    expect(onRemoveBookmarks).toHaveBeenCalledWith(['a']);
  });
});
