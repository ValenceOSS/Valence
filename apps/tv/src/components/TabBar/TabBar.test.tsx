import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { Film, Home } from '@keyline-icons/react-native/fill';
import { TabBar } from '@ValenceTv/components/TabBar/TabBar';

type Part = 'home' | 'films' | 'shows';

const TABS: readonly { id: Part; label: string; icon?: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'films', label: 'Films', icon: Film },
  { id: 'shows', label: 'Shows' },
];

type Drawn = Awaited<ReturnType<typeof render>>;

const pillOf = (drawn: Drawn) =>
  drawn.root?.children.find(
    (part) => typeof part !== 'string' && part.props.pointerEvents === 'none',
  );

describe('TabBar', () => {
  it('lays out a tab for each part', async () => {
    const drawn = await render(<TabBar tabs={TABS} current="home" onChoose={jest.fn()} />);

    expect(drawn.getByRole('button', { name: 'Home' })).toBeOnTheScreen();
    expect(drawn.getByRole('button', { name: 'Films' })).toBeOnTheScreen();
    expect(drawn.getByRole('button', { name: 'Shows' })).toBeOnTheScreen();
  });

  it('opens a part as the remote lands on its tab', async () => {
    const onChoose = jest.fn();
    const drawn = await render(<TabBar tabs={TABS} current="home" onChoose={onChoose} />);

    await fireEvent(drawn.getByRole('button', { name: 'Films' }), 'focus');

    expect(onChoose).toHaveBeenCalledWith('films');
  });

  it('leaves the part showing alone as the remote comes back onto its tab', async () => {
    const onChoose = jest.fn();
    const drawn = await render(<TabBar tabs={TABS} current="home" onChoose={onChoose} />);

    await fireEvent(drawn.getByRole('button', { name: 'Home' }), 'focus');

    expect(onChoose).not.toHaveBeenCalled();
  });

  it('opens a part when its tab is pressed', async () => {
    const onChoose = jest.fn();
    const drawn = await render(<TabBar tabs={TABS} current="home" onChoose={onChoose} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Shows' }));

    expect(onChoose).toHaveBeenCalledWith('shows');
  });

  it('says when the remote comes into the row and when it leaves', async () => {
    const onFocusChange = jest.fn();
    const drawn = await render(
      <TabBar tabs={TABS} current="home" onChoose={jest.fn()} onFocusChange={onFocusChange} />,
    );

    await fireEvent(drawn.getByRole('button', { name: 'Home' }), 'focus');

    expect(onFocusChange).toHaveBeenLastCalledWith(true);

    await fireEvent(drawn.getByRole('button', { name: 'Home' }), 'blur');

    expect(onFocusChange).toHaveBeenLastCalledWith(false);
  });

  it('hands each tab over by its name', async () => {
    const itemRef = jest.fn();

    await render(<TabBar tabs={TABS} current="home" onChoose={jest.fn()} itemRef={itemRef} />);

    expect(itemRef).toHaveBeenCalledWith('home', expect.anything());
    expect(itemRef).toHaveBeenCalledWith('films', expect.anything());
    expect(itemRef).toHaveBeenCalledWith('shows', expect.anything());
  });

  it('sits a pill behind the tab showing, lit white while the remote is in the row', async () => {
    const drawn = await render(<TabBar tabs={TABS} current="films" onChoose={jest.fn()} />);

    expect(pillOf(drawn)).toBeUndefined();

    await fireEvent(drawn.getByRole('button', { name: 'Films' }), 'layout', {
      nativeEvent: { layout: { x: 120, y: 0, width: 140, height: 60 } },
    });

    expect(pillOf(drawn)).toHaveStyle({
      left: 120,
      width: 140,
      backgroundColor: 'rgba(255,255,255,0.16)',
    });

    await fireEvent(drawn.getByRole('button', { name: 'Films' }), 'focus');

    expect(pillOf(drawn)).toHaveStyle({ backgroundColor: '#ffffff' });
  });

  it('writes the tab the remote is on in dark ink', async () => {
    const drawn = await render(<TabBar tabs={TABS} current="home" onChoose={jest.fn()} />);

    await fireEvent(drawn.getByRole('button', { name: 'Shows' }), 'focus');

    expect(drawn.getByText('Shows')).toHaveStyle({ color: '#000000' });
    expect(drawn.getByText('Home')).toHaveStyle({ color: '#fafafa' });
    expect(drawn.getByText('Films')).toHaveStyle({ color: '#a0a0a0' });
  });
});
