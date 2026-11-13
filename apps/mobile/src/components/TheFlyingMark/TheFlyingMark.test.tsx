import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render } from '@testing-library/react-native';
import { THE_MARKS_PLACE } from '@ValenceMobile/components/ACarriedMark/THE_MARKS_PLACE';
import { makeTheMarksWay } from '@ValenceMobile/components/ACarriedMark/makeTheMarksWay';
import { TheFlyingMark } from './TheFlyingMark';

describe('TheFlyingMark', () => {
  it('offers to carry the mark between pages, and lands it where asked', async () => {
    const way = makeTheMarksWay();

    await render(
      <QueryClientProvider client={new QueryClient()}>
        <THE_MARKS_PLACE.Provider value={way}>
          <TheFlyingMark />
        </THE_MARKS_PLACE.Provider>
      </QueryClientProvider>,
    );

    await act(() => {
      way.leave({ x: 0, y: 0, width: 40, height: 40 });
    });

    let isLanding = false;

    await act(() => {
      isLanding = way.land({ x: 100, y: 100, width: 40, height: 40 }, jest.fn());
    });

    expect(isLanding).toBe(true);
  });
});
