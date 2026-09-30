import { describe, expect, it } from 'vitest';
import { qualityFromProbe } from './qualityFromProbe';

/**
 * A probe of a file, with only what a test cares about given.
 */
const probed = (
  video: { codec: string; height: number; width?: number } | null,
  audio: object[] = [],
) => ({
  video: video === null ? null : { width: 1920, ...video },
  audioStreams: audio.map((one) => ({ codec: 'aac', channels: 2, profile: null, ...one })),
});

describe('qualityFromProbe', () => {
  it('reads the resolution from the frame, and the codec by the name ffprobe uses', () => {
    expect(qualityFromProbe(probed({ codec: 'hevc', height: 2160 }))).toMatchObject({
      resolution: '2160p',
      codec: 'h265',
    });
    expect(qualityFromProbe(probed({ codec: 'h264', height: 1080 }))).toMatchObject({
      resolution: '1080p',
      codec: 'h264',
    });
  });

  it('calls a frame a few lines short by the name every release gives it', () => {
    expect(qualityFromProbe(probed({ codec: 'h264', height: 1038 })).resolution).toBe('1080p');
    expect(
      qualityFromProbe(probed({ codec: 'h264', width: 320, height: 240 })).resolution,
    ).toBeUndefined();
  });

  it('reads a film shot wide by its width, which its letterboxed height undersells', () => {
    expect(qualityFromProbe(probed({ codec: 'hevc', width: 3840, height: 1608 })).resolution).toBe(
      '2160p',
    );
    expect(qualityFromProbe(probed({ codec: 'h264', width: 1920, height: 804 })).resolution).toBe(
      '1080p',
    );
    expect(qualityFromProbe(probed({ codec: 'h264', width: 1280, height: 534 })).resolution).toBe(
      '720p',
    );
  });

  it('tells standard definition apart by height, where widths are shared', () => {
    expect(
      qualityFromProbe(probed({ codec: 'mpeg2video', width: 720, height: 576 })).resolution,
    ).toBe('576p');
    expect(
      qualityFromProbe(probed({ codec: 'mpeg2video', width: 720, height: 480 })).resolution,
    ).toBe('480p');
  });

  it('names the audio on the first track, and its channels', () => {
    expect(
      qualityFromProbe(probed({ codec: 'hevc', height: 2160 }, [{ codec: 'eac3', channels: 6 }])),
    ).toMatchObject({ audio: ['eac3'], audioChannels: '5.1' });
  });

  it('tells the three kinds of DTS apart by the profile, which is where ffprobe puts it', () => {
    const dts = (profile: string | null) =>
      qualityFromProbe(probed({ codec: 'hevc', height: 2160 }, [{ codec: 'dts', profile }])).audio;

    expect(dts('DTS-HD MA')).toEqual(['dtsHdMa']);
    expect(dts('DTS-HD MA + DTS:X')).toEqual(['dtsx']);
    expect(dts(null)).toEqual(['dts']);
  });

  it('keeps Atmos beside the codec carrying it', () => {
    expect(
      qualityFromProbe(
        probed({ codec: 'hevc', height: 2160 }, [
          { codec: 'truehd', channels: 8, profile: 'Dolby TrueHD + Dolby Atmos' },
        ]),
      ),
    ).toMatchObject({ audio: ['truehd', 'atmos'], audioChannels: '7.1' });
  });

  it('says nothing of where it came from, which no probe can know', () => {
    expect(qualityFromProbe(probed({ codec: 'h264', height: 1080 }))).not.toHaveProperty('source');
  });

  it('says nothing at all of a file with no video in it', () => {
    expect(qualityFromProbe(probed(null))).toEqual({});
  });
});
