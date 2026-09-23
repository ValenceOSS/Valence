import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { thePhonesMusicAudio } from './thePhonesMusicAudio';
import type { NativeMusic } from './NativeMusic.types';

const aSpeaker = () => {
  const heard = new Map<string, (said: object) => void>();
  const speaker: NativeMusic = {
    load: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    seek: jest.fn(),
    setVolume: jest.fn(),
    setMuted: jest.fn(),
    describe: jest.fn(),
    stop: jest.fn(),
    addListener: (event, listener) => {
      heard.set(event, listener);

      return { remove: () => undefined };
    },
  };

  return { speaker, say: (said: object) => heard.get('onAudio')?.(said) };
};

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

describe('thePhonesMusicAudio', () => {
  it('loads a track from this server before playing it', async () => {
    const { speaker } = aSpeaker();
    const audio = thePhonesMusicAudio(speaker);

    audio.src = '/api/music/tracks/one/stream';
    await audio.play();

    expect(speaker.load).toHaveBeenCalledWith(
      'http://one.local:8420/api/music/tracks/one/stream',
      null,
    );
    expect(speaker.play).toHaveBeenCalled();
    expect(audio.paused).toBe(false);
  });

  it('passes on volume, muting and pausing', () => {
    const { speaker } = aSpeaker();
    const audio = thePhonesMusicAudio(speaker);

    audio.volume = 0.4;
    audio.muted = true;
    audio.pause();

    expect(speaker.setVolume).toHaveBeenCalledWith(0.4);
    expect(speaker.setMuted).toHaveBeenCalledWith(true);
    expect(audio.paused).toBe(true);
  });

  it('takes where the track is from what the phone says, and tells whoever listens', () => {
    const { speaker, say } = aSpeaker();
    const audio = thePhonesMusicAudio(speaker);
    const onTime = jest.fn();

    audio.addEventListener('timeupdate', onTime);
    say({ type: 'timeupdate', currentTime: 12, duration: 200, paused: false });

    expect(audio.currentTime).toBe(12);
    expect(audio.duration).toBe(200);
    expect(onTime).toHaveBeenCalled();
  });
});
