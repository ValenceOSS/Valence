import { fireEvent, render, screen } from '@testing-library/react-native';
import { AReaderSheet } from './AReaderSheet';
import type { AReaderSheetProps } from './AReaderSheet.types';

const CHAPTERS = [
  { id: 'one', label: 'Chapter one', isHere: true },
  { id: 'two', label: 'Chapter two', isHere: false },
];

const aSheet = (overrides: Partial<AReaderSheetProps> = {}) => (
  <AReaderSheet
    isOpen
    onClose={jest.fn()}
    title="One-Punch Man"
    isRightToLeft={false}
    onRightToLeft={jest.fn()}
    layout="one"
    onLayout={jest.fn()}
    isCoverAlone
    onCoverAlone={jest.fn()}
    chapters={CHAPTERS}
    onChapter={jest.fn()}
    {...overrides}
  />
);

const everyHostWith = (found: Parameters<typeof screen.container.queryAll>[0]) =>
  screen.container.queryAll(found);

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
    await fireEvent(theHostWith((one) => 'isPresented' in one.props), 'isPresentedChange', {
      nativeEvent: { isPresented: false },
    });

    expect(onClose).toHaveBeenCalledTimes(1);

    await fireEvent(theHostWith((one) => one.props.label === 'Done'), 'buttonPress');

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('does not say it was put away when it rises', async () => {
    const onClose = jest.fn();

    await render(aSheet({ onClose }));
    await fireEvent(theHostWith((one) => 'isPresented' in one.props), 'isPresentedChange', {
      nativeEvent: { isPresented: true },
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('turns the pages the way picked', async () => {
    const onRightToLeft = jest.fn();

    await render(aSheet({ onRightToLeft }));
    await fireEvent(
      theHostWith((one) => one.props.selection === 'leftToRight'),
      'selectionChange',
      { nativeEvent: { selection: 'rightToLeft' } },
    );

    expect(onRightToLeft).toHaveBeenCalledWith(true);
  });

  it('shows as many pages at once as picked', async () => {
    const onLayout = jest.fn();

    await render(aSheet({ onLayout }));
    await fireEvent(theHostWith((one) => one.props.selection === 'one'), 'selectionChange', {
      nativeEvent: { selection: 'two' },
    });

    expect(onLayout).toHaveBeenCalledWith('two');
  });

  it('offers no choice of how many pages where the phone decides that itself', async () => {
    await render(aSheet({ layout: null }));

    expect(everyHostWith((one) => 'selection' in one.props)).toHaveLength(1);
    expect(
      theHostWith((one) => one.props.text === 'Open the phone out to read two pages side by side.'),
    ).toBeTruthy();
  });

  it('sets the cover on its own, or not, as switched', async () => {
    const onCoverAlone = jest.fn();

    await render(aSheet({ onCoverAlone }));
    await fireEvent(
      theHostWith((one) => one.props.label === 'Cover on its own'),
      'isOnChange',
      { nativeEvent: { isOn: false } },
    );

    expect(onCoverAlone).toHaveBeenCalledWith(false);
  });

  it('lists the chapters, ticking the open one, and opens the one pressed', async () => {
    const onChapter = jest.fn();

    await render(aSheet({ onChapter }));

    const chapters = everyHostWith(
      (one) => 'onButtonPress' in one.props && one.props.label !== 'Done',
    );

    expect(chapters).toHaveLength(2);
    expect(everyHostWith((one) => one.props.systemName === 'checkmark')).toHaveLength(1);

    await fireEvent(chapters[1] ?? screen.container, 'buttonPress');

    expect(onChapter).toHaveBeenCalledWith('two');
  });
});
