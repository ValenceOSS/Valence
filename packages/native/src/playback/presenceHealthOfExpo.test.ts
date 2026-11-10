import { presenceHealthOfExpo } from './presenceHealthOfExpo';

const PLAYING = {
  currentTime: 600.25,
  duration: 7200,
  bufferedPosition: 630.25,
  videoTrack: { size: { width: 3840, height: 1608 } },
};

describe('presenceHealthOfExpo', () => {
  it('reports where the player is, how far it has buffered and the picture it draws', () => {
    expect(presenceHealthOfExpo(PLAYING, 0)).toEqual({
      positionSeconds: 600.25,
      durationSeconds: 7200,
      bufferedAheadSeconds: 30,
      presentedWidth: 3840,
      presentedHeight: 1608,
    });
  });

  it('takes the length the server knows over what a stream still being made says', () => {
    expect(presenceHealthOfExpo({ ...PLAYING, duration: 640 }, 7215.5).durationSeconds).toBe(
      7215.5,
    );
  });

  it('sends nothing the server would refuse before the player knows the stream', () => {
    expect(
      presenceHealthOfExpo(
        {
          currentTime: Number.NaN,
          duration: Number.POSITIVE_INFINITY,
          bufferedPosition: -1,
          videoTrack: null,
        },
        0,
      ),
    ).toEqual({
      positionSeconds: 0,
      durationSeconds: 0,
      bufferedAheadSeconds: 0,
      presentedWidth: 0,
      presentedHeight: 0,
    });
  });

  it('reports no buffer where the player has fallen behind what it says it holds', () => {
    expect(
      presenceHealthOfExpo({ ...PLAYING, bufferedPosition: 590 }, 0).bufferedAheadSeconds,
    ).toBe(0);
  });
});
