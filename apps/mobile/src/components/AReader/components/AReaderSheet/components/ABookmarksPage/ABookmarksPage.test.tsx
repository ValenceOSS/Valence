import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ABookmarksPage } from './ABookmarksPage';

const BOOKMARKS = [
  { id: 'a', place: 'Page 3', chapter: 'Chapter two', excerpt: null, picture: null },
  {
    id: 'b',
    place: 'Page 12 · 40%',
    chapter: null,
    excerpt: 'The spice must flow.',
    picture: null,
  },
];

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

/**
 * Lets the frame pass that picking waits for before the list is edited.
 */
const aFramePasses = async () => {
  await act(async () => {
    await new Promise<void>((done) => {
      requestAnimationFrame(() => {
        done();
      });
    });
  });
};

describe('ABookmarksPage', () => {
  it('says there are no bookmarks yet, and offers nothing to select', async () => {
    await render(<ABookmarksPage bookmarks={[]} onBookmark={jest.fn()} onRemove={jest.fn()} />);

    expect(theHostWith((one) => one.props.title === 'No bookmarks yet')).toBeTruthy();
    expect(everyHostWith((one) => one.props.label === 'Select')).toHaveLength(0);
  });

  it('names each by its words or its page, with its place and chapter beneath', async () => {
    await render(
      <ABookmarksPage bookmarks={BOOKMARKS} onBookmark={jest.fn()} onRemove={jest.fn()} />,
    );

    expect(theHostWith((one) => one.props.text === 'Page 3')).toBeTruthy();
    expect(theHostWith((one) => one.props.text === 'Chapter two')).toBeTruthy();
    expect(theHostWith((one) => one.props.text === 'The spice must flow.')).toBeTruthy();
    expect(theHostWith((one) => one.props.text === 'Page 12 · 40%')).toBeTruthy();
  });

  it('goes to the bookmark pressed', async () => {
    const onBookmark = jest.fn();

    await render(
      <ABookmarksPage bookmarks={BOOKMARKS} onBookmark={onBookmark} onRemove={jest.fn()} />,
    );

    const [, second] = everyHostWith(
      (one) => 'onButtonPress' in one.props && one.props.label === undefined,
    );

    await fireEvent(second ?? screen.container, 'buttonPress');

    expect(onBookmark).toHaveBeenCalledWith('b');
  });

  it('removes the bookmark swiped away', async () => {
    const onRemove = jest.fn();

    await render(
      <ABookmarksPage bookmarks={BOOKMARKS} onBookmark={jest.fn()} onRemove={onRemove} />,
    );
    await fireEvent(
      theHostWith((one) => one.props.deleteEnabled === true),
      'delete',
      {
        nativeEvent: { indices: [1] },
      },
    );

    expect(onRemove).toHaveBeenCalledWith(['b']);
  });

  it('picks several and removes them together, offering Remove only once any are picked', async () => {
    const onRemove = jest.fn();

    await render(
      <ABookmarksPage bookmarks={BOOKMARKS} onBookmark={jest.fn()} onRemove={onRemove} />,
    );
    await fireEvent(
      theHostWith((one) => one.props.label === 'Select'),
      'buttonPress',
    );
    await aFramePasses();

    expect(theHostWith((one) => one.props.label === 'Done')).toBeTruthy();
    expect(everyHostWith((one) => one.props.role === 'destructive')).toHaveLength(0);

    await fireEvent(
      theHostWith((one) => 'selection' in one.props && Array.isArray(one.props.selection)),
      'selectionChange',
      { nativeEvent: { selection: ['a', 'b'] } },
    );

    const remove = theHostWith((one) => one.props.role === 'destructive');

    expect(remove).toHaveProp('label', 'Remove 2 bookmarks');

    await fireEvent(remove, 'buttonPress');

    expect(onRemove).toHaveBeenCalledWith(['a', 'b']);
  });

  it('stops picking when Done is pressed', async () => {
    await render(
      <ABookmarksPage bookmarks={BOOKMARKS} onBookmark={jest.fn()} onRemove={jest.fn()} />,
    );
    await fireEvent(
      theHostWith((one) => one.props.label === 'Select'),
      'buttonPress',
    );
    await aFramePasses();
    await fireEvent(
      theHostWith((one) => one.props.label === 'Done'),
      'buttonPress',
    );
    await aFramePasses();

    expect(theHostWith((one) => one.props.label === 'Select')).toBeTruthy();
  });
});
