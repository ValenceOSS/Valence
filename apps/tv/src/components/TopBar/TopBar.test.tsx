import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { TopBar } from '@ValenceTv/components/TopBar/TopBar';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { TopBarProps } from '@ValenceTv/components/TopBar/TopBar.types';

const ADA: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Ada',
  colour: '#3a8ee8',
  avatar: { kind: 'initial' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
};

const aBar = (overrides: Partial<TopBarProps> = {}): TopBarProps => ({
  current: 'home',
  onChoose: jest.fn(),
  profile: ADA,
  itemRef: jest.fn(),
  onTabFocus: jest.fn(),
  isArriving: false,
  onFaceAt: jest.fn(),
  onMarkAt: jest.fn(),
  hasMusic: false,
  ...overrides,
});

describe('TopBar', () => {
  it('holds search, the parts there are and the face of whoever is watching', async () => {
    const drawn = await render(<TopBar {...aBar()} />);

    expect(drawn.getByRole('button', { name: 'Search' })).toBeOnTheScreen();
    expect(drawn.getByRole('button', { name: 'Home' })).toBeOnTheScreen();
    expect(drawn.getByRole('button', { name: 'Films' })).toBeOnTheScreen();
    expect(drawn.getByRole('button', { name: 'Shows' })).toBeOnTheScreen();
    expect(drawn.getByRole('button', { name: "Ada's profile" })).toBeOnTheScreen();
    expect(drawn.getByText('A')).toBeOnTheScreen();
  });

  it('adds music only where there is music to listen to', async () => {
    const without = await render(<TopBar {...aBar()} />);

    expect(without.queryByRole('button', { name: 'Music' })).toBeNull();

    const withMusic = await render(<TopBar {...aBar({ hasMusic: true })} />);

    expect(withMusic.getByRole('button', { name: 'Music' })).toBeOnTheScreen();
  });

  it('has no face where nobody is watching', async () => {
    const drawn = await render(<TopBar {...aBar({ profile: null })} />);

    expect(drawn.queryByRole('button', { name: "Ada's profile" })).toBeNull();
  });

  it('opens search as the remote lands on it, and when it is pressed', async () => {
    const onChoose = jest.fn();
    const drawn = await render(<TopBar {...aBar({ onChoose })} />);

    await fireEvent(drawn.getByRole('button', { name: 'Search' }), 'focus');

    expect(onChoose).toHaveBeenLastCalledWith('search');

    onChoose.mockClear();
    await userEvent.press(drawn.getByRole('button', { name: 'Search' }));

    expect(onChoose).toHaveBeenLastCalledWith('search');
  });

  it('opens the profile as the remote lands on the face, and when it is pressed', async () => {
    const onChoose = jest.fn();
    const drawn = await render(<TopBar {...aBar({ onChoose })} />);

    await fireEvent(drawn.getByRole('button', { name: "Ada's profile" }), 'focus');

    expect(onChoose).toHaveBeenLastCalledWith('account');

    onChoose.mockClear();
    await userEvent.press(drawn.getByRole('button', { name: "Ada's profile" }));

    expect(onChoose).toHaveBeenLastCalledWith('account');
  });

  it('opens a part as the remote lands on its tab, and says the remote is in the tabs', async () => {
    const onChoose = jest.fn();
    const onTabFocus = jest.fn();
    const drawn = await render(<TopBar {...aBar({ onChoose, onTabFocus })} />);

    await fireEvent(drawn.getByRole('button', { name: 'Films' }), 'focus');

    expect(onChoose).toHaveBeenCalledWith('films');
    expect(onTabFocus).toHaveBeenLastCalledWith(true);

    await fireEvent(drawn.getByRole('button', { name: 'Films' }), 'blur');

    expect(onTabFocus).toHaveBeenLastCalledWith(false);
  });

  it('hands over each of its items by name', async () => {
    const itemRef = jest.fn();

    await render(<TopBar {...aBar({ itemRef })} />);

    for (const name of ['search', 'home', 'films', 'shows', 'account']) {
      expect(itemRef).toHaveBeenCalledWith(name, expect.anything());
    }
  });

  it('keeps the face and the mark hidden while they fly into place', async () => {
    const drawn = await render(<TopBar {...aBar({ isArriving: true })} />);

    expect(drawn.getByText('A').parent?.parent).toHaveStyle({ opacity: 0 });

    await drawn.rerender(<TopBar {...aBar({ isArriving: false })} />);

    expect(drawn.getByText('A').parent?.parent).not.toHaveStyle({ opacity: 0 });
  });
});
