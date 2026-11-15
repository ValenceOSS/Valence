import { render } from '@testing-library/react-native';
import { createElement as mockCreateElement, useEffect as mockUseEffect } from 'react';
import { Text, View as mockView } from 'react-native';
import type { ReactNode } from 'react';
import { AShelfRow } from './AShelfRow';

const mockArriving = jest.fn<undefined, [{ at: number; isArrived: boolean }]>();

jest.mock('@ValenceMobile/components/ACardArrival/ACardArrival', () => ({
  ACardArrival: ({
    children,
    at,
    isArrived = false,
    onArrived,
  }: {
    children: ReactNode;
    at: number;
    isArrived?: boolean;
    onArrived?: () => void;
  }) => {
    mockArriving({ at, isArrived });
    mockUseEffect(() => {
      if (!isArrived) {
        onArrived?.();
      }
    }, [isArrived, onArrived]);

    return mockCreateElement(mockView, null, children);
  },
}));

/**
 * What tells one film from another.
 *
 * @param film - The film.
 * @returns Its name.
 */
const nameOf = (film: string) => film;

beforeEach(() => {
  mockArriving.mockClear();
});

describe('AShelfRow', () => {
  it('draws each card in its place along the row', async () => {
    const drawn = await render(
      <AShelfRow
        items={['Dune', 'Arrival']}
        keyOf={nameOf}
        drawn={(film) => <Text>{film}</Text>}
      />,
    );

    expect(drawn.getByText('Dune')).toBeTruthy();
    expect(mockArriving).toHaveBeenCalledWith({ at: 1, isArrived: false });
  });

  it('lets a card that has arrived once simply be there when it is drawn again', async () => {
    const films = ['Dune', 'Arrival'];
    const drawn = await render(
      <AShelfRow items={films} keyOf={nameOf} drawn={(film) => <Text>{film}</Text>} />,
    );

    mockArriving.mockClear();

    await drawn.rerender(
      <AShelfRow items={films} keyOf={nameOf} drawn={(film) => <Text>{`${film}!`}</Text>} />,
    );

    expect(drawn.getByText('Dune!')).toBeTruthy();
    expect(mockArriving).toHaveBeenCalledWith({ at: 0, isArrived: true });
    expect(mockArriving).not.toHaveBeenCalledWith(expect.objectContaining({ isArrived: false }));
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AShelfRow.displayName).toBe('AShelfRow');
  });
});
