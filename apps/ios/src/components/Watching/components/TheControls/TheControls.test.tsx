import { render, userEvent } from '@testing-library/react-native';
import { TheControls } from './TheControls';
import type { TheControlsProps } from './TheControls.types';

const theControls = (overrides: Partial<TheControlsProps> = {}) => (
  <TheControls
    title="Arrival"
    isPlaying
    at={251}
    runsFor={6960}
    buffered={900}
    onPlayPause={jest.fn()}
    onSkip={jest.fn()}
    onSeek={jest.fn()}
    onTouched={jest.fn()}
    onClose={jest.fn()}
    onSettings={jest.fn()}
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

  it('keeps everything else behind one button, rather than on the picture', async () => {
    const onSettings = jest.fn();
    const drawn = await render(theControls({ onSettings }));

    await userEvent.press(drawn.getByLabelText('Subtitles, audio and quality'));

    expect(onSettings).toHaveBeenCalled();
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
});
