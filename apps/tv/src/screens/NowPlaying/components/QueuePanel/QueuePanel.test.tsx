import { render, userEvent } from '@testing-library/react-native';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { QueuePanel } from '@ValenceTv/screens/NowPlaying/components/QueuePanel/QueuePanel';

describe('QueuePanel', () => {
  it('lists every song still to come, in the order it will play', async () => {
    const drawn = await render(
      <QueuePanel
        upcoming={[
          { at: 3, track: aTrack(7) },
          { at: 4, track: aTrack(2) },
        ]}
        picks={[]}
        onJump={jest.fn()}
      />,
    );

    expect(drawn.getByText('Up next')).toBeTruthy();
    expect(drawn.getAllByRole('button')).toEqual([
      drawn.getByRole('button', { name: 'Track 7, Sleep Token' }),
      drawn.getByRole('button', { name: 'Track 2, Sleep Token' }),
    ]);
    expect(drawn.getByText('1')).toBeTruthy();
    expect(drawn.getByText('2')).toBeTruthy();
  });

  it('plays the chosen song now, by where it sits in the whole order', async () => {
    const onJump = jest.fn();
    const drawn = await render(
      <QueuePanel
        upcoming={[
          { at: 3, track: aTrack(7) },
          { at: 4, track: aTrack(2) },
        ]}
        picks={[]}
        onJump={onJump}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Track 2, Sleep Token' }));

    expect(onJump).toHaveBeenCalledWith(4);
  });

  it('says so when nothing plays after this song', async () => {
    const drawn = await render(<QueuePanel upcoming={[]} picks={[]} onJump={jest.fn()} />);

    expect(drawn.getByText('Nothing is queued after this song.')).toBeTruthy();
    expect(drawn.queryAllByRole('button')).toHaveLength(0);
  });

  it('marks a song smart shuffle mixed in from the library', async () => {
    const drawn = await render(
      <QueuePanel
        upcoming={[
          { at: 3, track: aTrack(7) },
          { at: 4, track: aTrack(2) },
        ]}
        picks={[aTrack(2).id]}
        onJump={jest.fn()}
      />,
    );

    expect(drawn.getAllByText('Smart shuffle · Sleep Token')).toHaveLength(1);
  });
});
