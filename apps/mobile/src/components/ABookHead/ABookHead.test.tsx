import { render } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { holdAWindowOf } from '@ValenceMobile/testing/holdAWindowOf';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { ABookHead } from './ABookHead';

const COVER = 'http://one.local/cover.jpg';

/**
 * The book's cover standing in the middle of its head, rather than the blur behind it.
 *
 * @returns Where it was drawn.
 */
const theCover = () => {
  const sharp = theDrawnRoot()
    .queryAll((one) => one.type === 'Image')
    .at(-1)?.parent;

  if (sharp === null || sharp === undefined) {
    throw new Error('No cover was drawn.');
  }

  return sharp;
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ABookHead', () => {
  it('draws the cover over a blur of itself', async () => {
    await render(<ABookHead title="Dune" cover={COVER} />, { wrapper: CacheScope });

    expect(theDrawnRoot().queryAll((one) => one.type === 'Image')).toHaveLength(2);
  });

  it('draws the cover a share of the width of a phone held upright', async () => {
    holdAWindowOf(400, 852);
    await render(<ABookHead title="Dune" cover={COVER} />, { wrapper: CacheScope });

    expect(theCover()).toHaveStyle({ width: 184 });
  });

  it('keeps the cover to a share of the height on the wide inside of a folding phone', async () => {
    holdAWindowOf(871, 669);
    await render(<ABookHead title="Dune" cover={COVER} />, { wrapper: CacheScope });

    expect(theCover()).toHaveStyle({ width: 669 * 0.28 });
  });

  it('draws no pictures for a book without a cover, and writes its title out', async () => {
    const drawn = await render(<ABookHead title="Dune" cover={null} />, { wrapper: CacheScope });

    expect(theDrawnRoot().queryAll((one) => one.type === 'Image')).toHaveLength(0);
    expect(drawn.getByText('Dune')).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ABookHead.displayName).toBe('ABookHead');
  });
});
