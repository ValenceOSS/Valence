import { render, userEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { TheControls } from './TheControls';
import type { TheControlsProps } from './TheControls.types';

const theControls = (overrides: Partial<TheControlsProps> = {}) => (
  <TheControls
    fade={new Animated.Value(1)}
    title="Arrival"
    year={2016}
    isPlaying
    at={251}
    runsFor={6960}
    buffered={900}
    trickplay={null}
    onPlayPause={jest.fn()}
    onSkip={jest.fn()}
    onSeek={jest.fn()}
    onTouched={jest.fn()}
    onClose={jest.fn()}
    rate={1}
    qualityLabel="Auto"
    onLock={jest.fn()}
    onPictureInPicture={jest.fn()}
    onSpeed={jest.fn()}
    onAudioAndSubtitles={jest.fn()}
    onQuality={jest.fn()}
    onStats={jest.fn()}
    {...overrides}
  />
);

describe('TheControls', () => {
  it('says what is playing', async () => {
    const drawn = await render(theControls());

    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('says how far in they are', async () => {
    const drawn = await render(theControls());

    expect(drawn.getByText('4:11')).toBeTruthy();
  });

  it('says how much is left, rather than making them do the sum', async () => {
    const drawn = await render(theControls());

    expect(drawn.getByText('−1:51:49')).toBeTruthy();
  });

  it('offers to stop the picture while it is moving', async () => {
    const onPlayPause = jest.fn();
    const drawn = await render(theControls({ onPlayPause }));

    await userEvent.press(drawn.getByLabelText('Pause'));

    expect(onPlayPause).toHaveBeenCalled();
  });

  it('offers to start it again while it is stopped', async () => {
    const drawn = await render(theControls({ isPlaying: false }));

    expect(drawn.getByLabelText('Play')).toBeTruthy();
    expect(drawn.queryByLabelText('Pause')).toBeNull();
  });

  it('jumps back ten seconds', async () => {
    const onSkip = jest.fn();
    const drawn = await render(theControls({ onSkip }));

    await userEvent.press(drawn.getByLabelText('Back 10 seconds'));

    expect(onSkip).toHaveBeenCalledWith(-10);
  });

  it('jumps forward ten seconds', async () => {
    const onSkip = jest.fn();
    const drawn = await render(theControls({ onSkip }));

    await userEvent.press(drawn.getByLabelText('Forward 10 seconds'));

    expect(onSkip).toHaveBeenCalledWith(10);
  });

  it('offers a way out', async () => {
    const onClose = jest.fn();
    const drawn = await render(theControls({ onClose }));

    await userEvent.press(drawn.getByLabelText('Stop watching'));

    expect(onClose).toHaveBeenCalled();
  });

  it('names each panel along the foot, saying the speed and quality playing', async () => {
    const onAudioAndSubtitles = jest.fn();
    const drawn = await render(theControls({ onAudioAndSubtitles }));

    expect(drawn.getByText('Speed (Normal)')).toBeTruthy();
    expect(drawn.getByText('Quality (Auto)')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('Audio & Subtitles'));

    expect(onAudioAndSubtitles).toHaveBeenCalled();
  });

  it('opens stats for nerds and locks the controls from the top', async () => {
    const onStats = jest.fn();
    const onLock = jest.fn();
    const drawn = await render(theControls({ onStats, onLock }));

    await userEvent.press(drawn.getByLabelText('Stats for nerds'));
    await userEvent.press(drawn.getByLabelText('Lock the controls'));

    expect(onStats).toHaveBeenCalled();
    expect(onLock).toHaveBeenCalled();
  });

  it('offers the next episode only where there is one', async () => {
    const onNext = jest.fn();
    const drawn = await render(theControls({ onNext }));

    await userEvent.press(drawn.getByLabelText('Next Episode'));

    expect(onNext).toHaveBeenCalled();
    expect((await render(theControls())).queryByLabelText('Next Episode')).toBeNull();
  });

  it('says where in the film the line stands, for anybody who cannot see it', async () => {
    const drawn = await render(theControls());

    expect(
      drawn.getByRole('adjustable', {
        name: 'Seek through Arrival',
        value: { min: 0, max: 6960, now: 251 },
      }),
    ).toBeTruthy();
  });

  it('shows nothing of a film whose length is not known yet, rather than a broken line', async () => {
    const drawn = await render(theControls({ at: 0, runsFor: 0, buffered: 0 }));

    expect(drawn.getByText('0:00')).toBeTruthy();
  });

  it('says the whole of it is left at the very beginning', async () => {
    const drawn = await render(theControls({ at: 0 }));

    expect(drawn.getByText('−1:56:00')).toBeTruthy();
  });

  it('says when it came out, as every other client does', async () => {
    const drawn = await render(theControls());

    expect(drawn.getByText('2016')).toBeTruthy();
  });

  it('says nothing about a year nobody recorded', async () => {
    const drawn = await render(theControls({ year: null }));

    expect(drawn.queryByText('2016')).toBeNull();
    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('marks the intro and every chapter break along the line', async () => {
    const drawn = await render(
      theControls({
        segments: [{ kind: 'intro', startSeconds: 0, endSeconds: 60, source: 'fingerprint' }],
        chapters: [
          { title: 'Opening', startSeconds: 0, endSeconds: 300 },
          { title: null, startSeconds: 300, endSeconds: 600 },
        ],
      }),
    );

    expect(drawn.getAllByTestId('slider-stretch')).toHaveLength(1);
    expect(drawn.getAllByTestId('slider-notch')).toHaveLength(1);
  });
});
