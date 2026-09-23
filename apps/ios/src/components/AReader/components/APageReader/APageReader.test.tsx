import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aBook } from '@ValencePhone/testing/aBook';
import { aChapter } from '@ValencePhone/testing/aChapter';
import { APageReader } from './APageReader';

const COMIC = aBook({ title: 'One-Punch Man', layout: 'fixed' });

const CHAPTERS = [
  aChapter(1, { format: 'cbz', pageCount: 3 }),
  aChapter(2, { format: 'cbz', pageCount: 3 }),
];

beforeEach(() => {
  installPlatform(aFakePlatform());
});

const aReader = (onPage = jest.fn(), onChapter = jest.fn()) => (
  <APageReader
    book={COMIC}
    chapters={CHAPTERS}
    chapterId={CHAPTERS[0]?.id ?? ''}
    startAtPage={0}
    onChapter={onChapter}
    onPage={onPage}
    onBack={jest.fn()}
  />
);

describe('APageReader', () => {
  it('opens at the page asked, saying where in the chapter it is, and remembers it', async () => {
    const onPage = jest.fn();
    const drawn = await render(aReader(onPage), { wrapper: CacheScope });

    expect(drawn.getByText('Page 1 of 3')).toBeTruthy();
    expect(onPage).toHaveBeenCalledWith(0, false);
  });

  it('turns on a tap at the right of a page read left to right', async () => {
    const drawn = await render(aReader(), { wrapper: CacheScope });

    await fireEvent.press(drawn.getByRole('button', { name: 'Page 1' }), {
      nativeEvent: { locationX: 9999, locationY: 10 },
    });

    expect(drawn.getByText('Page 2 of 3')).toBeTruthy();
  });

  it('stays on the first page when tapped back from it', async () => {
    const drawn = await render(aReader(), { wrapper: CacheScope });

    await fireEvent.press(drawn.getByRole('button', { name: 'Page 1' }), {
      nativeEvent: { locationX: 1, locationY: 10 },
    });

    expect(drawn.getByText('Page 1 of 3')).toBeTruthy();
  });

  it('lists the chapters in its panel, and opens the one picked', async () => {
    const onChapter = jest.fn();
    const drawn = await render(aReader(jest.fn(), onChapter), { wrapper: CacheScope });

    await userEvent.press(drawn.getByRole('button', { name: 'Contents and settings' }));
    await userEvent.press(drawn.getByText('Chapter 2'));

    expect(onChapter).toHaveBeenCalledWith(CHAPTERS[1]?.id);
  });
});
