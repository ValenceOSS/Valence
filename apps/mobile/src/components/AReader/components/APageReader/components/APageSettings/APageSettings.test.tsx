import { fireEvent, render, screen } from '@testing-library/react-native';
import { APageSettings } from './APageSettings';
import type { APageSettingsProps } from './APageSettings.types';

/**
 * The page reader's settings as anything but manga is read, with no choice of direction.
 *
 * @returns Their props.
 */
const withoutDirection = (): APageSettingsProps => ({
  isRightToLeft: false,
  layout: 'one',
  onLayout: jest.fn(),
  isCoverAlone: true,
  onCoverAlone: jest.fn(),
  isTapToTurn: false,
  onTapToTurn: jest.fn(),
  surround: 'edge',
  onSurround: jest.fn(),
});

/**
 * The page reader's settings as a manga is read, and whatever a test changes.
 *
 * @param overrides - What the test changes.
 * @returns The settings.
 */
const theSettings = (overrides: Partial<APageSettingsProps> = {}) => (
  <APageSettings {...withoutDirection()} onRightToLeft={jest.fn()} {...overrides} />
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

describe('APageSettings', () => {
  it('turns the pages the way picked', async () => {
    const onRightToLeft = jest.fn();

    await render(theSettings({ onRightToLeft }));
    await fireEvent(
      theHostWith((one) => one.props.selection === 'leftToRight'),
      'selectionChange',
      { nativeEvent: { selection: 'rightToLeft' } },
    );

    expect(onRightToLeft).toHaveBeenCalledWith(true);
  });

  it('offers no choice of direction for anything but manga', async () => {
    await render(<APageSettings {...withoutDirection()} />);

    expect(everyHostWith((one) => one.props.selection === 'leftToRight')).toHaveLength(0);
  });

  it('shows as many pages at once as picked', async () => {
    const onLayout = jest.fn();

    await render(theSettings({ onLayout }));
    await fireEvent(
      theHostWith((one) => one.props.selection === 'one'),
      'selectionChange',
      { nativeEvent: { selection: 'two' } },
    );

    expect(onLayout).toHaveBeenCalledWith('two');
  });

  it('offers no choice of how many pages where the phone decides that itself', async () => {
    await render(theSettings({ layout: null }));

    expect(
      everyHostWith((one) => one.props.selection === 'one' || one.props.selection === 'two'),
    ).toHaveLength(0);
    expect(
      theHostWith((one) => one.props.text === 'Unfold the phone to read two pages side by side.'),
    ).toBeTruthy();
  });

  it('sets the cover on its own, or not, as switched', async () => {
    const onCoverAlone = jest.fn();

    await render(theSettings({ onCoverAlone }));
    await fireEvent(
      theHostWith((one) => one.props.label === 'Show cover as a single page'),
      'isOnChange',
      { nativeEvent: { isOn: false } },
    );

    expect(onCoverAlone).toHaveBeenCalledWith(false);
  });

  it('offers to turn the page with a tap on either side, off until chosen', async () => {
    const onTapToTurn = jest.fn();

    await render(theSettings({ onTapToTurn }));

    const toggle = theHostWith((one) => one.props.label === 'Tap the sides to turn');

    expect(toggle).toHaveProp('isOn', false);

    await fireEvent(toggle, 'isOnChange', { nativeEvent: { isOn: true } });

    expect(onTapToTurn).toHaveBeenCalledWith(true);
  });

  it('puts the colour chosen round the page', async () => {
    const onSurround = jest.fn();

    await render(theSettings({ onSurround }));
    await fireEvent(
      theHostWith((one) => one.props.selection === 'edge'),
      'selectionChange',
      { nativeEvent: { selection: 'grey' } },
    );

    expect(onSurround).toHaveBeenCalledWith('grey');
  });
});
