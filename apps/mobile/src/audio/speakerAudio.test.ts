import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { speakerAudio } from '@ValenceMobile/audio/speakerAudio';
import { aFakeSpeaker } from '@ValenceMobile/testing/aFakeSpeaker';

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

describe('speakerAudio', () => {
  it('loads a file from this server on its own channel before playing it', async () => {
    const { speaker } = aFakeSpeaker();
    const audio = speakerAudio(speaker, 'music');

    audio.src = '/api/music/tracks/one/stream';
    await audio.play();

    expect(speaker.load).toHaveBeenCalledWith(
      'music',
      'http://one.local:8420/api/music/tracks/one/stream',
      null,
    );
    expect(speaker.play).toHaveBeenCalledWith('music');
    expect(audio.paused).toBe(false);
  });

  it('passes on volume, muting, speed and pausing', () => {
    const { speaker } = aFakeSpeaker();
    const audio = speakerAudio(speaker, 'book');

    audio.volume = 0.4;
    audio.muted = true;
    audio.playbackRate = 1.5;
    audio.pause();

    expect(speaker.setVolume).toHaveBeenCalledWith('book', 0.4);
    expect(speaker.setMuted).toHaveBeenCalledWith('book', true);
    expect(speaker.setRate).toHaveBeenCalledWith('book', 1.5);
    expect(audio.playbackRate).toBe(1.5);
    expect(audio.paused).toBe(true);
  });

  it('stops the speaker when the file is taken away, rather than loading nothing', () => {
    const { speaker } = aFakeSpeaker();
    const audio = speakerAudio(speaker, 'book');

    audio.src = '';

    expect(speaker.stop).toHaveBeenCalledWith('book');
    expect(speaker.load).not.toHaveBeenCalled();
  });

  it('takes where the file is from what its own speaker says, and tells whoever listens', () => {
    const { speaker, say } = aFakeSpeaker();
    const audio = speakerAudio(speaker, 'music');
    const onTime = jest.fn();

    audio.addEventListener('timeupdate', onTime);
    say({ channel: 'book', type: 'timeupdate', currentTime: 99, duration: 900, paused: false });

    expect(onTime).not.toHaveBeenCalled();

    say({ channel: 'music', type: 'timeupdate', currentTime: 12, duration: 200, paused: false });

    expect(audio.currentTime).toBe(12);
    expect(audio.duration).toBe(200);
    expect(onTime).toHaveBeenCalled();
  });
});

describe('speakerAudio, changing its mind', () => {
  it('never loads a file taken away before its session arrived', async () => {
    const { speaker } = aFakeSpeaker();
    const audio = speakerAudio(speaker, 'book');

    audio.src = '/api/books/one/chapters/1/audio';
    audio.src = '';
    await new Promise(setImmediate);

    expect(speaker.load).not.toHaveBeenCalled();
    expect(speaker.stop).toHaveBeenCalledWith('book');
  });

  it('loads only the last of two files asked for quickly', async () => {
    const { speaker } = aFakeSpeaker();
    const audio = speakerAudio(speaker, 'music');

    audio.src = '/api/music/tracks/one/stream';
    audio.src = '/api/music/tracks/two/stream';
    await audio.play();

    expect(speaker.load).toHaveBeenCalledTimes(1);
    expect(speaker.load).toHaveBeenCalledWith(
      'music',
      'http://one.local:8420/api/music/tracks/two/stream',
      null,
    );
  });

  it('lines up the next file behind the one handed over, and takes it as playing once it advances', async () => {
    const { speaker, say } = aFakeSpeaker();
    const audio = speakerAudio(speaker, 'music');

    audio.src = '/api/music/tracks/one/stream';
    audio.lineUp?.('/api/music/tracks/two/stream');
    await new Promise(setImmediate);

    expect(speaker.lineUp).toHaveBeenCalledWith(
      'music',
      'http://one.local:8420/api/music/tracks/two/stream',
      null,
    );
    expect(speaker.load.mock.invocationCallOrder[0]).toBeLessThan(
      speaker.lineUp.mock.invocationCallOrder[0] ?? 0,
    );

    say({ channel: 'music', type: 'advanced', currentTime: 0, duration: 180, paused: false });

    expect(audio.src).toBe('/api/music/tracks/two/stream');
  });

  it('never lines up behind a file that has since been replaced', async () => {
    const { speaker } = aFakeSpeaker();
    const audio = speakerAudio(speaker, 'music');

    audio.src = '/api/music/tracks/one/stream';
    audio.lineUp?.('/api/music/tracks/two/stream');
    audio.src = '/api/music/tracks/three/stream';
    await new Promise(setImmediate);

    expect(speaker.lineUp).not.toHaveBeenCalled();
  });
});
