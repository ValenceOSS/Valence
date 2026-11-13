import { fireEvent, render, screen } from '@testing-library/react-native';
import { ATextSettings } from './ATextSettings';
import type { ATextSettingsProps } from './ATextSettings.types';

const SPACINGS = [
  { id: 'tight', label: 'Tight' },
  { id: 'normal', label: 'Normal' },
];

const MARGINS = [
  { id: 'narrow', label: 'Narrow' },
  { id: 'wide', label: 'Wide' },
];

/**
 * The text reader's settings, and whatever a test changes.
 *
 * @param overrides - What the test changes.
 * @returns The settings.
 */
const theSettings = (overrides: Partial<ATextSettingsProps> = {}) => (
  <ATextSettings
    isScrolling={false}
    onScrolling={jest.fn()}
    isAnimated
    onAnimated={jest.fn()}
    spacings={SPACINGS}
    spacing="normal"
    onSpacing={jest.fn()}
    margins={MARGINS}
    margin="narrow"
    onMargin={jest.fn()}
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

describe('ATextSettings', () => {
  it('turns the book into a scroll when picked', async () => {
    const onScrolling = jest.fn();

    await render(theSettings({ onScrolling }));
    await fireEvent(
      theHostWith((one) => one.props.selection === 'pages'),
      'selectionChange',
      { nativeEvent: { selection: 'scroll' } },
    );

    expect(onScrolling).toHaveBeenCalledWith(true);
  });

  it('offers to animate a turn only while the book turns as pages', async () => {
    const onAnimated = jest.fn();

    await render(theSettings({ onAnimated }));
    await fireEvent(
      theHostWith((one) => one.props.label === 'Animate turning pages'),
      'isOnChange',
      { nativeEvent: { isOn: false } },
    );

    expect(onAnimated).toHaveBeenCalledWith(false);

    await render(theSettings({ isScrolling: true }));

    expect(everyHostWith((one) => one.props.label === 'Animate turning pages')).toHaveLength(0);
  });

  it('sets the line spacing and the margins picked', async () => {
    const onSpacing = jest.fn();
    const onMargin = jest.fn();

    await render(theSettings({ onSpacing, onMargin }));
    await fireEvent(
      theHostWith((one) => one.props.selection === 'normal'),
      'selectionChange',
      { nativeEvent: { selection: 'tight' } },
    );
    await fireEvent(
      theHostWith((one) => one.props.selection === 'narrow'),
      'selectionChange',
      { nativeEvent: { selection: 'wide' } },
    );

    expect(onSpacing).toHaveBeenCalledWith('tight');
    expect(onMargin).toHaveBeenCalledWith('wide');
  });
});
