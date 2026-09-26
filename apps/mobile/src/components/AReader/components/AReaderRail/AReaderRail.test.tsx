import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { AReaderRail } from './AReaderRail';
import type { AReaderRailProps } from './AReaderRail.types';

const PICTURES = ['/pages/0', '/pages/1', '/pages/2', '/pages/3'];

const TUNING = { buttonsX: -5, scrubberX: 31, scrubberWidth: 70, top: 166, isOutlined: false };

const aRail = (overrides: Partial<AReaderRailProps> = {}) => (
  <AReaderRail
    breadth={70}
    freeFrom={176}
    below={20}
    side="right"
    centreIn={35}
    pictures={PICTURES}
    page={1}
    ink="#ffffff"
    tuning={TUNING}
    onPage={jest.fn()}
    onBack={jest.fn()}
    onPanel={jest.fn()}
    onReadOn={null}
    {...overrides}
  />
);

const theHostWith = (found: Parameters<typeof screen.container.queryAll>[0]) => {
  const [one] = screen.container.queryAll(found);

  if (one === undefined) {
    throw new Error('Nothing like that was drawn.');
  }

  return one;
};

describe('AReaderRail', () => {
  it('goes back, and brings out the contents and settings', async () => {
    const onBack = jest.fn();
    const onPanel = jest.fn();

    await render(aRail({ onBack, onPanel }));
    await userEvent.press(screen.getByRole('button', { name: 'Back' }));
    await userEvent.press(screen.getByRole('button', { name: 'Contents and settings' }));

    expect(onBack).toHaveBeenCalled();
    expect(onPanel).toHaveBeenCalled();
  });

  it('says how far through the chapter the page showing is', async () => {
    await render(aRail());

    expect(screen.getByText('2/4')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Next chapter' })).toBeNull();
  });

  it('offers the next chapter in place of the count on the last page', async () => {
    const onReadOn = jest.fn();

    await render(aRail({ page: 3, onReadOn }));

    expect(screen.queryByText('4/4')).toBeNull();

    await userEvent.press(screen.getByRole('button', { name: 'Next chapter' }));

    expect(onReadOn).toHaveBeenCalled();
  });

  it('hands the column every page to scrub through, and turns to the one left in the middle', async () => {
    const onPage = jest.fn();

    await render(aRail({ onPage }));
    await fireEvent(theHostWith((one) => 'onLayout' in one.props), 'layout', {
      nativeEvent: { layout: { width: 70, height: 400, x: 0, y: 0 } },
    });

    const column = theHostWith((one) => one.type === 'ViewManagerAdapter_ValencePageScrubber');

    expect(column).toHaveProp('page', 1);
    expect(column).toHaveProp('pictures', PICTURES);

    await fireEvent(column, 'page', { nativeEvent: { page: 3 } });

    expect(onPage).toHaveBeenCalledWith(3);
  });
});
