import { waitFor } from '@testing-library/react-native';
import { MediaPlayerIdleReason, MediaPlayerState } from 'react-native-google-cast';
import { castTrackAddressOf } from '@ValenceClient/music/castTrackAddressOf';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aFakeCastClient } from '@ValenceMobile/testing/aFakeCastClient';
import { castAudio } from './castAudio';

jest.mock('@ValenceClient/music/castTrackAddressOf', () => ({
  castTrackAddressOf: jest.fn((trackId: string) => Promise.resolve(`/api/music/cast/${trackId}`)),
}));

const ONE = '00000000-0000-4000-8000-000000000001';
const TWO = '00000000-0000-4000-8000-000000000002';
const streamOf = (trackId: string) => `/api/music/tracks/${trackId}/stream?quality=high`;

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

describe('castAudio', () => {
  it('sends a song from its ticketed address, from where it was asked to start', async () => {
    const { client } = aFakeCastClient();
    const audio = castAudio(client, { describe: () => null, onLost: jest.fn() });

    audio.src = streamOf(ONE);
    audio.currentTime = 42;
    await audio.play();

    const loaded = client.loadMedia.mock.calls[0]?.[0];

    expect(castTrackAddressOf).toHaveBeenCalledWith(ONE, 'high');
    expect(loaded?.autoplay).toBe(true);
    expect(loaded?.startTime).toBe(42);
    expect(loaded?.mediaInfo?.contentId).toBe(streamOf(ONE));
    expect(loaded?.mediaInfo?.contentUrl).toBe(`http://one.local:8420/api/music/cast/${ONE}`);
    expect(client.play).toHaveBeenCalled();
  });

  it('says what the device does in the words an audio element would', () => {
    const { client, say } = aFakeCastClient();
    const audio = castAudio(client, { describe: () => null, onLost: jest.fn() });
    const told: string[] = [];

    for (const type of ['loadedmetadata', 'playing', 'pause', 'ended']) {
      audio.addEventListener(type, () => told.push(type));
    }

    audio.src = streamOf(ONE);
    say(streamOf(ONE));
    say(streamOf(ONE), { playerState: MediaPlayerState.PAUSED });
    say(streamOf(ONE), {
      playerState: MediaPlayerState.IDLE,
      idleReason: MediaPlayerIdleReason.FINISHED,
    });

    expect(told).toEqual(['loadedmetadata', 'playing', 'pause', 'ended']);
    expect(audio.duration).toBe(300);
  });

  it('queues the song lined up next, and says it advanced when the device runs on into it', async () => {
    const { client, say } = aFakeCastClient();
    const audio = castAudio(client, { describe: () => null, onLost: jest.fn() });
    const advanced = jest.fn();

    audio.addEventListener('advanced', advanced);
    audio.src = streamOf(ONE);
    audio.lineUp?.(streamOf(TWO), 1);

    await waitFor(() => {
      expect(client.queueInsertItem).toHaveBeenCalledWith(
        expect.objectContaining({ autoplay: true }),
      );
    });

    say(streamOf(TWO));

    expect(advanced).toHaveBeenCalled();
    expect(audio.src).toBe(streamOf(TWO));
  });

  it('says it is lost when the device is sent something else', () => {
    const { client, say } = aFakeCastClient();
    const onLost = jest.fn();
    const audio = castAudio(client, { describe: () => null, onLost });

    audio.src = streamOf(ONE);
    say('/api/playback/cast/film/index.m3u8');

    expect(onLost).toHaveBeenCalled();
  });
});
