import { Film, Inbox } from '@keyline-icons/react-native';
import { render, userEvent } from '@testing-library/react-native';
import { AFloatingTabs } from './AFloatingTabs';

const TABS = [
  { id: 'library', label: 'Library', icon: Film, symbol: 'film.stack' },
  { id: 'requests', label: 'Requests', icon: Inbox, symbol: 'tray' },
] as const;

const theTabs = (overrides: { onSelect?: () => void } = {}) => (
  <AFloatingTabs
    tabs={TABS}
    value="library"
    onSelect={overrides.onSelect ?? jest.fn()}
    onMeasure={jest.fn()}
    isFaceArriving={false}
  />
);

describe('AFloatingTabs', () => {
  it('marks the tab showing, and says which was pressed', async () => {
    const onSelect = jest.fn();
    const drawn = await render(theTabs({ onSelect }));

    expect(drawn.getByRole('button', { name: 'Library', selected: true })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Requests', selected: false })).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Requests' }));

    expect(onSelect).toHaveBeenCalledWith('requests');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AFloatingTabs.displayName).toBe('AFloatingTabs');
  });
});
