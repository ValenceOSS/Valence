import { View } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { useReportSpot } from '@ValenceTv/layout/useReportSpot';
import type { Spot } from '@ValenceTv/components/Flight/Flight.types';

type Reported = ReturnType<typeof useReportSpot>;

const drawn: { spot: Reported | null } = { spot: null };

const ASpot = ({ onAt, isDrawn = true }: { onAt?: (at: Spot) => void; isDrawn?: boolean }) => {
  const spot = useReportSpot(onAt);

  drawn.spot = spot;

  return isDrawn ? <View ref={spot.ref} onLayout={spot.onLayout} /> : null;
};

ASpot.displayName = 'ASpot';

const theSpot = (): Reported => {
  if (drawn.spot === null) {
    throw new Error('Nothing was drawn');
  }

  return drawn.spot;
};

const placeAt = (at: Spot): void => {
  const view = theSpot().ref.current;

  if (view === null) {
    throw new Error('The view was not drawn');
  }

  jest.spyOn(view, 'measureInWindow').mockImplementation((told) => {
    told(at.x, at.y, at.width, at.height);
  });
};

beforeEach(() => {
  drawn.spot = null;
});

describe('useReportSpot', () => {
  it('says where the view is each time it is laid out', async () => {
    const onAt = jest.fn();

    await render(<ASpot onAt={onAt} />);
    placeAt({ x: 1, y: 2, width: 3, height: 4 });

    await act(async () => {
      theSpot().onLayout();
      await Promise.resolve();
    });

    expect(onAt).toHaveBeenCalledWith({ x: 1, y: 2, width: 3, height: 4 });
  });

  it('can be asked where the view is now', async () => {
    await render(<ASpot />);
    placeAt({ x: 5, y: 6, width: 7, height: 8 });

    await expect(theSpot().whereNow()).resolves.toEqual({ x: 5, y: 6, width: 7, height: 8 });
  });

  it('knows nowhere while nothing is drawn', async () => {
    await render(<ASpot isDrawn={false} />);

    await expect(theSpot().whereNow()).resolves.toBeNull();
  });
});
