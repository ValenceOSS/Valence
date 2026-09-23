import { Film, Inbox } from '@keyline-icons/react-native';
import { render, userEvent } from '@testing-library/react-native';
import { TheTabs } from './TheTabs';

const TABS = [
  { id: 'library', label: 'Library', icon: Film, symbol: 'film.stack' },
  { id: 'requests', label: 'Requests', icon: Inbox, symbol: 'tray' },
] as const;

describe('TheTabs', () => {
  it('marks the one showing', async () => {
    const drawn = await render(
      <TheTabs tabs={TABS} value="library" onSelect={jest.fn()}>
        {null}
      </TheTabs>,
    );

    expect(drawn.getByRole('button', { name: 'Library', selected: true })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Requests', selected: false })).toBeTruthy();
  });

  it('says which one was pressed', async () => {
    const onSelect = jest.fn();
    const drawn = await render(
      <TheTabs tabs={TABS} value="library" onSelect={onSelect}>
        {null}
      </TheTabs>,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Requests' }));

    expect(onSelect).toHaveBeenCalledWith('requests');
  });
});
