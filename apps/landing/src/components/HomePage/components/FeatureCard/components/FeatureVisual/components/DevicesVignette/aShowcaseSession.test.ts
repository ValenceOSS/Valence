import { describe, expect, it } from 'vitest';
import { aShowcaseSession } from './aShowcaseSession';

const SHOWN = {
  id: 'maya-tv',
  who: 'Maya',
  title: 'Harbour Lights',
  device: 'Living room TV',
  kind: 'tv',
  isConverting: false,
  at: 0.5,
} as const;

describe('aShowcaseSession', () => {
  it('makes a film being watched, sent as it is', () => {
    const session = aShowcaseSession(SHOWN);

    expect(session.profileName).toBe('Maya');
    expect(session.playback?.mediaTitle).toBe('Harbour Lights');
    expect(session.playback?.seriesTitle).toBeNull();
    expect(session.playback?.mode).toBe('direct');
    expect(session.playback?.plan.video.kind).toBe('passthrough');
    expect(session.playback?.health?.positionSeconds).toBe(
      (session.playback?.health?.durationSeconds ?? 0) / 2,
    );
  });

  it('makes an episode being watched, its picture converted', () => {
    const session = aShowcaseSession({
      ...SHOWN,
      episode: { season: 2, number: 4, title: 'Low Tide' },
      isConverting: true,
    });

    expect(session.playback?.seriesTitle).toBe('Harbour Lights');
    expect(session.playback?.mediaTitle).toBe('Low Tide');
    expect(session.playback?.seasonNumber).toBe(2);
    expect(session.playback?.mode).toBe('transcode');
    expect(session.playback?.plan.video.kind).toBe('transcode');
  });
});
