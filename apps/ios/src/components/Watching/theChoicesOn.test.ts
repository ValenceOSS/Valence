import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { AudioStreamSchema } from '@ValenceContracts/schemas/MediaItem';
import { theChoicesOn } from './theChoicesOn';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';

const aStream = (index: number, language: string, isDefault = false): AudioStream =>
  AudioStreamSchema.parse({
    index,
    codec: 'eac3',
    channels: 6,
    language,
    isDefault,
    isAtmos: false,
  });

const aFilm = (width: number, height: number) =>
  MediaDetailSchema.parse({
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    title: 'Arrival',
    year: 2016,
    container: 'mkv',
    durationSeconds: 6960,
    videoCodec: 'hevc',
    videoRange: 'SDR',
    width,
    height,
    bitrateKbps: 30000,
    audioStreams: [aStream(1, 'eng', true)],
    subtitleStreams: [],
    addedAt: '2026-01-01T00:00:00.000Z',
    metadata: { hasPoster: false, hasBackdrop: false, hasLogo: false },
  });

const aTrack = (
  id: string,
  label: string,
  delivery: 'text' | 'burnIn' = 'text',
): SubtitleTrack => ({
  id,
  language: 'eng',
  label,
  format: 'srt',
  isForced: false,
  isHearingImpaired: false,
  delivery,
  streamIndex: null,
});

const asking = {
  media: aFilm(3840, 2160),
  subtitles: [],
  chosenSubtitle: 'off',
  onSubtitle: jest.fn(),
  chosenAudio: null,
  chosenQuality: 'original' as const,
  onAudio: jest.fn(),
  onQuality: jest.fn(),
  rate: 1,
  onRate: jest.fn(),
  subtitleOffset: 0,
  onSubtitleOffset: jest.fn(),
};

describe('theChoicesOn', () => {
  it('says nothing about sound where a film has only one', () => {
    const sets = theChoicesOn({ ...asking, streams: [aStream(1, 'eng', true)] });

    expect(sets.map((set) => set.heading)).not.toContain('Audio');
  });

  it('offers the soundtracks where a film has more than one', () => {
    const sets = theChoicesOn({
      ...asking,
      streams: [aStream(1, 'jpn', true), aStream(2, 'eng')],
    });
    const audio = sets.find((set) => set.heading === 'Audio');

    expect(audio?.choices).toHaveLength(2);
  });

  it('marks the file’s own default where nobody has chosen', () => {
    const sets = theChoicesOn({
      ...asking,
      streams: [aStream(1, 'jpn'), aStream(2, 'eng', true)],
    });

    expect(sets.find((set) => set.heading === 'Audio')?.chosen).toBe('2');
  });

  it('marks what they chose, over the default', () => {
    const sets = theChoicesOn({
      ...asking,
      chosenAudio: 1,
      streams: [aStream(1, 'jpn'), aStream(2, 'eng', true)],
    });

    expect(sets.find((set) => set.heading === 'Audio')?.chosen).toBe('1');
  });

  it('hands back the stream, not the place in the list', () => {
    const sets = theChoicesOn({
      ...asking,
      streams: [aStream(3, 'jpn', true), aStream(7, 'eng')],
    });

    sets.find((set) => set.heading === 'Audio')?.onChoose('7');

    expect(asking.onAudio).toHaveBeenCalledWith(7);
  });

  it('offers the file as it is, before anything smaller', () => {
    const sets = theChoicesOn({ ...asking, streams: [aStream(1, 'eng', true)] });
    const quality = sets.find((set) => set.heading === 'Quality');

    expect(quality?.choices[0]?.id).toBe('original');
    expect(quality?.choices[0]?.label).toBe('Original');
  });

  it('says what each step would cost, so the choice can be made on the number', () => {
    const sets = theChoicesOn({ ...asking, streams: [aStream(1, 'eng', true)] });
    const quality = sets.find((set) => set.heading === 'Quality');

    expect(quality?.choices.find((one) => one.id === '1080p')?.detail).toBe('up to 4.5 Mbps');
  });

  it('offers nothing bigger than the file itself', () => {
    const sets = theChoicesOn({
      ...asking,
      media: aFilm(1280, 720),
      streams: [aStream(1, 'eng', true)],
    });
    const quality = sets.find((set) => set.heading === 'Quality');

    expect(quality?.choices.map((one) => one.id)).not.toContain('2160p');
  });

  it('offers only the speed for a film nothing is known about yet', () => {
    expect(theChoicesOn({ ...asking, media: null, streams: [] }).map((set) => set.heading)).toEqual(
      ['Speed'],
    );
  });

  it('says nothing about subtitles for a film that has none', () => {
    const sets = theChoicesOn({ ...asking, streams: [aStream(1, 'eng', true)] });

    expect(sets.map((set) => set.heading)).not.toContain('Subtitles');
  });

  it('offers a single track, since off is the other half of that choice', () => {
    const sets = theChoicesOn({
      ...asking,
      subtitles: [aTrack('one', 'English')],
      streams: [aStream(1, 'eng', true)],
    });

    expect(sets.find((set) => set.heading === 'Subtitles')?.choices).toHaveLength(2);
  });

  it('offers off first, since that is where everybody starts', () => {
    const sets = theChoicesOn({
      ...asking,
      subtitles: [aTrack('one', 'English')],
      streams: [aStream(1, 'eng', true)],
    });

    expect(sets.find((set) => set.heading === 'Subtitles')?.choices[0]).toMatchObject({
      id: 'off',
      label: 'Off',
    });
  });

  it('says what kind each track is, since one may be a picture and another words', () => {
    const sets = theChoicesOn({
      ...asking,
      subtitles: [aTrack('one', 'English')],
      streams: [aStream(1, 'eng', true)],
    });

    expect(sets.find((set) => set.heading === 'Subtitles')?.choices[1]?.detail).toBe('SRT');
  });

  it('marks the one being read', () => {
    const sets = theChoicesOn({
      ...asking,
      chosenSubtitle: 'one',
      subtitles: [aTrack('one', 'English')],
      streams: [aStream(1, 'eng', true)],
    });

    expect(sets.find((set) => set.heading === 'Subtitles')?.chosen).toBe('one');
  });

  it('puts subtitles before sound, which is the order people look for them in', () => {
    const sets = theChoicesOn({
      ...asking,
      subtitles: [aTrack('one', 'English')],
      streams: [aStream(1, 'jpn', true), aStream(2, 'eng')],
    });

    expect(sets.map((set) => set.heading)).toEqual(['Subtitles', 'Audio', 'Quality', 'Speed']);
  });
});
