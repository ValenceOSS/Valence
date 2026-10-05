import { act, fireEvent, render } from '@testing-library/react-native';
import { usePaperOf } from '@ValenceMobile/hooks/usePaperOf';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { ASpread } from './components/ASpread/ASpread';
import { APageTurner } from './APageTurner';
import type { APageTurnerProps } from './APageTurner.types';

jest.mock('@ValenceMobile/hooks/usePaperOf', () => ({ usePaperOf: jest.fn(() => null) }));

jest.mock('./components/ASpread/ASpread', () => ({ ASpread: jest.fn(() => null) }));

const PAGES = ['http://one.local/p/0', 'http://one.local/p/1', 'http://one.local/p/2'];

const BREADTH = 300;

const aBook = async (given: Partial<APageTurnerProps> = {}) => {
  const said = {
    onTurn: jest.fn(),
    onMiddle: jest.fn(),
    onPastTheEnd: jest.fn(),
    onPaper: jest.fn(),
  };

  await render(
    <APageTurner
      pages={PAGES}
      page={0}
      isTwoUp={false}
      isCoverAlone
      isRightToLeft={false}
      paper="#000000"
      fit="both"
      isLocked={false}
      style={{}}
      {...said}
      {...given}
    />,
  );

  await fireEvent(theDrawnRoot(), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: BREADTH, height: 600 } },
  });

  return said;
};

const theSpread = (at = 0) => {
  const props = jest.mocked(ASpread).mock.calls[at]?.[0];

  if (props === undefined) {
    throw new Error('No spread was drawn.');
  }

  return props;
};

const tapAt = async (across: number) => {
  await act(() => {
    theSpread().onTap(across);
  });
};

beforeEach(() => {
  jest.mocked(ASpread).mockClear();
  jest.mocked(usePaperOf).mockReturnValue(null);
});

describe('APageTurner', () => {
  it('shows one page at a time where one is asked for', async () => {
    await aBook();

    expect(theSpread().leaves).toEqual([PAGES[0]]);
  });

  it('lays the cover alone on the side a book opens to, where two show at once', async () => {
    await aBook({ isTwoUp: true });

    expect(theSpread().leaves).toEqual([null, PAGES[0]]);
  });

  it('turns on from a tap on the outer right third', async () => {
    const said = await aBook();

    await tapAt(BREADTH - 10);

    expect(said.onTurn).toHaveBeenCalledWith(1);
  });

  it('says the middle was tapped rather than turning', async () => {
    const said = await aBook();

    await tapAt(BREADTH / 2);

    expect(said.onMiddle).toHaveBeenCalled();
    expect(said.onTurn).not.toHaveBeenCalled();
  });

  it('turns on from the left for a book read right to left', async () => {
    const said = await aBook({ isRightToLeft: true });

    await tapAt(10);

    expect(said.onTurn).toHaveBeenCalledWith(1);
  });

  it('turns nothing while the book is locked', async () => {
    const said = await aBook({ isLocked: true });

    await tapAt(BREADTH - 10);

    expect(said.onTurn).not.toHaveBeenCalled();
    expect(said.onMiddle).toHaveBeenCalled();
  });

  it('says the end was reached on turning past the last page', async () => {
    const said = await aBook({ page: 2 });

    await tapAt(BREADTH - 10);

    expect(said.onPastTheEnd).toHaveBeenCalled();
    expect(said.onTurn).not.toHaveBeenCalled();
  });

  it('says the colour round the edge of the page showing, once it is known', async () => {
    jest.mocked(usePaperOf).mockReturnValue('#f4ecd8');

    const said = await aBook();

    expect(said.onPaper).toHaveBeenCalledWith('#f4ecd8');
  });
});
