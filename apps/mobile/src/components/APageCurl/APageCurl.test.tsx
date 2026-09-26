import { fireEvent, render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { APageCurl } from './APageCurl';

const PAGES = ['http://one.local:8420/page/1', 'http://one.local:8420/page/2'];

const aBook = (onTurn = jest.fn(), onPaper = jest.fn()) =>
  render(
    <APageCurl
      pages={PAGES}
      page={1}
      isTwoUp={false}
      isCoverAlone
      isRightToLeft={false}
      paper="#101010"
      fit="both"
      isLocked={false}
      onTurn={onTurn}
      onMiddle={jest.fn()}
      onPastTheEnd={jest.fn()}
      onPaper={onPaper}
      style={{}}
    />,
  );

describe('APageCurl', () => {
  it('hands the book to the system’s page curl as it was given', async () => {
    await aBook();
    const book = theDrawnRoot();

    expect(book.type).toBe('ViewManagerAdapter_ValencePageCurl');
    expect(book).toHaveProp('pages', PAGES);
    expect(book).toHaveProp('page', 1);
    expect(book).toHaveProp('isCoverAlone', true);
    expect(book).toHaveProp('paper', '#101010');
    expect(book).toHaveProp('fit', 'both');
  });

  it('says which page the book was turned to', async () => {
    const onTurn = jest.fn();
    await aBook(onTurn);

    await fireEvent(theDrawnRoot(), 'turn', { nativeEvent: { page: 4 } });

    expect(onTurn).toHaveBeenCalledWith(4);
  });

  it('says the colour round the edge of the page showing', async () => {
    const onPaper = jest.fn();
    await aBook(jest.fn(), onPaper);

    await fireEvent(theDrawnRoot(), 'paper', { nativeEvent: { colour: '#f4ecd8' } });

    expect(onPaper).toHaveBeenCalledWith('#f4ecd8');
  });
});
