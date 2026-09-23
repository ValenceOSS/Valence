import { render, userEvent } from '@testing-library/react-native';
import { PlayerControls } from '@ValenceTv/screens/Player/components/PlayerControls/PlayerControls';
import type { PlayerControlsProps } from '@ValenceTv/screens/Player/components/PlayerControls/PlayerControls.types';

const draw = (change: Partial<PlayerControlsProps> = {}) => {
  const props: PlayerControlsProps = {
    title: 'Severance',
    year: 2022,
    certification: '15',
    subtitle: 'S1: E2 · Half Loop',
    position: 60,
    duration: 3000,
    isPlaying: true,
    scrubAt: null,
    trickplay: null,
    onToggle: jest.fn(),
    onSeekBy: jest.fn(),
    onScrubFocus: jest.fn(),
    onScrubBlur: jest.fn(),
    onScrubPress: jest.fn(),
    onSettings: jest.fn(),
    onNext: jest.fn(),
    onTouched: jest.fn(),
    ...change,
  };

  return { props, drawn: render(<PlayerControls {...props} />) };
};

describe('PlayerControls', () => {
  it('shows what is playing, its year, its age rating and the episode', async () => {
    const drawn = await draw().drawn;

    expect(drawn.getByText('Severance')).toBeTruthy();
    expect(drawn.getByText('2022')).toBeTruthy();
    expect(drawn.getByText('15')).toBeTruthy();
    expect(drawn.getByText('S1: E2 · Half Loop')).toBeTruthy();
  });

  it('leaves out what it does not know', async () => {
    const drawn = await draw({ year: null, certification: null, subtitle: null }).drawn;

    expect(drawn.queryByText('2022')).toBeNull();
    expect(drawn.queryByText('15')).toBeNull();
    expect(drawn.queryByText('S1: E2 · Half Loop')).toBeNull();
  });

  it('pauses while playing and plays while paused, keeping the controls up', async () => {
    const { props, drawn: drawing } = draw();
    const drawn = await drawing;

    await userEvent.press(drawn.getByRole('button', { name: 'Pause' }));

    expect(props.onToggle).toHaveBeenCalledTimes(1);
    expect(props.onTouched).toHaveBeenCalledTimes(1);

    const paused = await draw({ isPlaying: false }).drawn;

    expect(paused.getByRole('button', { name: 'Play' })).toBeTruthy();
  });

  it('goes back and forward ten seconds', async () => {
    const { props, drawn: drawing } = draw();
    const drawn = await drawing;
    const [back, forward] = drawn.getAllByRole('button', { name: '10s' });

    if (back === undefined || forward === undefined) {
      throw new Error('The skip buttons were not drawn.');
    }

    await userEvent.press(back);

    expect(props.onSeekBy).toHaveBeenLastCalledWith(-10);

    await userEvent.press(forward);

    expect(props.onSeekBy).toHaveBeenLastCalledWith(10);
    expect(props.onTouched).toHaveBeenCalledTimes(2);
  });

  it('opens the settings, and moves on to the next episode', async () => {
    const { props, drawn: drawing } = draw();
    const drawn = await drawing;

    await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Next episode' }));

    expect(props.onSettings).toHaveBeenCalledTimes(1);
    expect(props.onNext).toHaveBeenCalledTimes(1);
  });

  it('offers no next episode where there is none', async () => {
    const drawn = await draw({ onNext: null }).drawn;

    expect(drawn.queryByRole('button', { name: 'Next episode' })).toBeNull();
  });

  it('starts the remote on pause or play', async () => {
    const drawn = await draw().drawn;

    expect(drawn.getByRole('button', { name: 'Pause' })).toHaveProp('hasTVPreferredFocus', true);
  });

  it('hands the scrub bar what it needs and passes on what it hears', async () => {
    const { props, drawn: drawing } = draw({ scrubAt: 600 });
    const drawn = await drawing;

    expect(drawn.getAllByText('10:00')).toHaveLength(2);

    await userEvent.press(drawn.getByRole('button', { name: 'Scrub' }));

    expect(props.onScrubPress).toHaveBeenCalledTimes(1);
  });
});
