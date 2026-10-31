import { aFakeCastClient } from '@ValenceMobile/testing/aFakeCastClient';
import { castableAudio } from './castableAudio';
import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';

/**
 * An audio element for a test that remembers what it was told.
 *
 * @param paused - Whether it starts paused.
 * @returns The element, and what each kind of event was heard by.
 */
const anAudio = (paused = true) => {
  const heard = new Map<string, () => void>();
  const audio = {
    src: '',
    currentTime: 0,
    duration: 300,
    volume: 1,
    muted: false,
    paused,
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    lineUp: jest.fn(),
    release: jest.fn(),
    addEventListener: (type: string, listener: () => void) => {
      heard.set(type, listener);
    },
  } satisfies AudioLike;

  return { audio, heard };
};

describe('castableAudio', () => {
  it('moves a playing song onto the device from the same moment, with the next lined up', () => {
    const phone = anAudio(false);
    const device = anAudio();
    const castable = castableAudio(phone.audio, () => device.audio);

    castable.src = '/song';
    castable.currentTime = 61;
    castable.lineUp?.('/next', 1);
    castable.castTo(aFakeCastClient().client, 'Living Room');

    expect(phone.audio.pause).toHaveBeenCalled();
    expect(device.audio.src).toBe('/song');
    expect(device.audio.currentTime).toBe(61);
    expect(device.audio.lineUp).toHaveBeenCalledWith('/next', 1);
    expect(device.audio.play).toHaveBeenCalled();
    expect(castable.castingTo()).toBe('Living Room');
  });

  it('hears only whichever is playing', () => {
    const phone = anAudio();
    const device = anAudio();
    const castable = castableAudio(phone.audio, () => device.audio);
    const playing = jest.fn();

    castable.addEventListener('playing', playing);
    castable.castTo(aFakeCastClient().client, 'Living Room');
    phone.heard.get('playing')?.();

    expect(playing).not.toHaveBeenCalled();

    device.heard.get('playing')?.();

    expect(playing).toHaveBeenCalled();
  });

  it('brings the song back to the phone paused, and leaves the device alone', () => {
    const phone = anAudio();
    const device = anAudio(false);
    const castable = castableAudio(phone.audio, () => device.audio);
    const paused = jest.fn();
    const watching = jest.fn();

    castable.addEventListener('pause', paused);
    castable.subscribe(watching);
    castable.castTo(aFakeCastClient().client, 'Living Room');
    device.audio.src = '/advanced';
    device.audio.currentTime = 12;
    castable.bringBack();

    expect(phone.audio.src).toBe('/advanced');
    expect(phone.audio.currentTime).toBe(12);
    expect(phone.audio.play).not.toHaveBeenCalled();
    expect(device.audio.pause).not.toHaveBeenCalled();
    expect(device.audio.release).toHaveBeenCalled();
    expect(paused).toHaveBeenCalled();
    expect(castable.castingTo()).toBeNull();
    expect(watching).toHaveBeenCalledTimes(2);
  });
});
