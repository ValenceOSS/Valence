import { render } from '@testing-library/react-native';
import { THE_MARKS_PLACE } from '@ValenceMobile/components/ACarriedMark/THE_MARKS_PLACE';
import { makeTheMarksWay } from '@ValenceMobile/components/ACarriedMark/makeTheMarksWay';
import { TheFlyingMark } from './TheFlyingMark';

describe('TheFlyingMark', () => {
  it('offers to carry the mark between pages, and lands it where asked', async () => {
    const way = makeTheMarksWay();

    await render(
      <THE_MARKS_PLACE.Provider value={way}>
        <TheFlyingMark />
      </THE_MARKS_PLACE.Provider>,
    );

    way.leave({ x: 0, y: 0, width: 40, height: 40 });

    expect(way.land({ x: 100, y: 100, width: 40, height: 40 }, jest.fn())).toBe(true);
  });
});
