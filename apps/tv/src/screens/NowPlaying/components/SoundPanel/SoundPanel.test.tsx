import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { SoundPanel } from './SoundPanel';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('SoundPanel', () => {
  it('offers the streaming quality, volume levelling and crossfade', async () => {
    const drawn = await render(<SoundPanel />);

    expect(drawn.getByText('Streaming quality')).toBeTruthy();
    expect(drawn.getByText('Data saver')).toBeTruthy();
    expect(drawn.getByText('Volume levelling')).toBeTruthy();
    expect(drawn.getByText('Crossfade')).toBeTruthy();
    expect(drawn.getByText('Whole albums')).toBeTruthy();
  });

  it('streams at the quality chosen', async () => {
    const choosing = jest.spyOn(theMusicPlayer(), 'setQuality');
    const drawn = await render(<SoundPanel />);

    await userEvent.press(drawn.getByText('Normal'));

    expect(choosing).toHaveBeenCalledWith('normal');
    choosing.mockRestore();
  });

  it('levels songs the way chosen', async () => {
    const choosing = jest.spyOn(theMusicPlayer(), 'setLevelling');
    const drawn = await render(<SoundPanel />);

    await userEvent.press(drawn.getByText('Each song'));

    expect(choosing).toHaveBeenCalledWith('track');
    choosing.mockRestore();
  });

  it('fades songs into each other over the seconds chosen', async () => {
    const choosing = jest.spyOn(theMusicPlayer(), 'setCrossfade');
    const drawn = await render(<SoundPanel />);

    await userEvent.press(drawn.getByText('6 seconds'));

    expect(choosing).toHaveBeenCalledWith(6);
    choosing.mockRestore();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SoundPanel.displayName).toBe('SoundPanel');
  });
});
