import { describe, expect, it } from 'vitest';
import { joinWebVtt } from './joinWebVtt';

describe('joinWebVtt', () => {
  it('moves each later part’s cues on by where that part starts, keeping one header', () => {
    expect(
      joinWebVtt([
        { content: 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nFirst', offsetSeconds: 0 },
        { content: 'WEBVTT\n\n00:00:03.000 --> 00:00:04.500\nSecond\n', offsetSeconds: 3600 },
      ]),
    ).toBe(
      'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nFirst\n\n01:00:03.000 --> 01:00:04.500\nSecond\n',
    );
  });

  it('moves a track only a later part has to where that part starts', () => {
    expect(
      joinWebVtt([{ content: 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nLate', offsetSeconds: 60 }]),
    ).toBe('WEBVTT\n\n00:01:01.000 --> 00:01:02.000\nLate\n');
  });

  it('adds nothing for a part whose track has no cues', () => {
    expect(
      joinWebVtt([
        { content: 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nFirst', offsetSeconds: 0 },
        { content: 'WEBVTT', offsetSeconds: 60 },
      ]),
    ).toBe('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nFirst\n');
  });
});
