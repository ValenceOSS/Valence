import { useContext, useEffect } from 'react';
import { Film, Inbox } from '@keyline-icons/react-native';
import { render, userEvent } from '@testing-library/react-native';
import { setMinimized } from 'expo-glass-tabs/build/minimize-context';
import { TABS_FOLLOW_SCROLLING } from '@ValenceMobile/components/TheTabs/TABS_FOLLOW_SCROLLING';
import { AGlassTabs } from './AGlassTabs';

const TABS = [
  { id: 'library', label: 'Library', icon: Film, symbol: 'film.stack' },
  { id: 'requests', label: 'Requests', icon: Inbox, symbol: 'tray' },
] as const;

/**
 * A page that scrolls to each place it is given, one after another, as soon as it is drawn.
 */
const APage = ({ to }: { to: readonly number[] }) => {
  const tell = useContext(TABS_FOLLOW_SCROLLING);

  useEffect(() => {
    to.forEach((at) => {
      tell?.(at);
    });
  }, [tell, to]);

  return null;
};

const theTabs = (overrides: { onSelect?: () => void; scrolls?: readonly number[] } = {}) => (
  <AGlassTabs
    tabs={TABS}
    value="library"
    onSelect={overrides.onSelect ?? jest.fn()}
    onMeasure={jest.fn()}
    isFaceArriving={false}
  >
    <APage to={overrides.scrolls ?? []} />
  </AGlassTabs>
);

describe('AGlassTabs', () => {
  it('marks the tab showing, and says which was pressed', async () => {
    const onSelect = jest.fn();
    const drawn = await render(theTabs({ onSelect }));

    expect(drawn.getByRole('button', { name: 'Library', selected: true })).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Requests' }));

    expect(onSelect).toHaveBeenCalledWith('requests');
  });

  it('tucks in as a page scrolls down and comes back out as it scrolls up', async () => {
    jest.mocked(setMinimized).mockClear();

    await render(theTabs({ scrolls: [100, 200, 150] }));

    expect(jest.mocked(setMinimized).mock.calls.map(([, next]) => next)).toEqual([1, 1, 0, 0]);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AGlassTabs.displayName).toBe('AGlassTabs');
  });
});
