import { DEFAULT_CAPTION_STYLE } from '@ValenceClient/playback/captionStyle';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { AudioStreamSchema } from '@ValenceContracts/schemas/MediaItem';
import { thePhonesProfile } from '@ValenceMobile/playback/thePhonesProfile';
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
  profile: thePhonesProfile(),
  subtitles: [],
  chosenSubtitle: 'off',
  onSubtitle: jest.fn(),
  chosenAudio: null,
  chosenQuality: 'original' as const,
  onAudio: jest.fn(),
  onQuality: jest.fn(),
  captionStyle: DEFAULT_CAPTION_STYLE,
  onCaptionStyle: jest.fn(),
};

describe('theChoicesOn', () => {
  it('says nothing about sound where a film has only one', () => {
    expect(theChoicesOn({ ...asking, streams: [aStream(1, 'eng', true)] }).audio).toBeNull();
  });

  it('offers the soundtracks where a film has more than one', () => {
    const { audio } = theChoicesOn({
      ...asking,
      streams: [aStream(1, 'jpn', true), aStream(2, 'eng')],
    });

    expect(audio?.choices).toHaveLength(2);
  });

  it('marks the file’s own default where nobody has chosen', () => {
    const { audio } = theChoicesOn({
      ...asking,
      streams: [aStream(1, 'jpn'), aStream(2, 'eng', true)],
    });

    expect(audio?.chosen).toBe('2');
  });

  it('marks what they chose, over the default', () => {
    const { audio } = theChoicesOn({
      ...asking,
      chosenAudio: 1,
      streams: [aStream(1, 'jpn'), aStream(2, 'eng', true)],
    });

    expect(audio?.chosen).toBe('1');
  });

  it('hands back the stream, not the place in the list', () => {
    const { audio } = theChoicesOn({
      ...asking,
      streams: [aStream(3, 'jpn', true), aStream(7, 'eng')],
    });

    audio?.onChoose('7');

    expect(asking.onAudio).toHaveBeenCalledWith(7);
  });

  it('offers auto first, then the file as it is, before anything smaller', () => {
    const { quality } = theChoicesOn({ ...asking, streams: [aStream(1, 'eng', true)] });

    expect(quality?.choices[0]?.id).toBe('auto');
    expect(quality?.choices[1]?.id).toBe('original');
    expect(quality?.choices[1]?.label).toBe('Original (4K)');
  });

  it('says what each step would cost, so the choice can be made on the number', () => {
    const { quality } = theChoicesOn({ ...asking, streams: [aStream(1, 'eng', true)] });

    expect(quality?.choices.find((one) => one.id === '1080p')?.detail).toContain('Mbps');
    expect(quality?.choices.find((one) => one.id === '1080p')?.isDisabled).toBeUndefined();
  });

  it('offers nothing bigger than the file itself', () => {
    const { quality } = theChoicesOn({
      ...asking,
      media: aFilm(1280, 720),
      streams: [aStream(1, 'eng', true)],
    });

    expect(quality?.choices.map((one) => one.id)).not.toContain('2160p');
  });

  it('offers no quality for a film nothing is known about yet', () => {
    expect(theChoicesOn({ ...asking, media: null, streams: [] }).quality).toBeNull();
  });

  it('says nothing about subtitles for a film that has none', () => {
    expect(theChoicesOn({ ...asking, streams: [aStream(1, 'eng', true)] }).subtitles).toBeNull();
  });

  it('offers a single track with off first, since off is the other half of that choice', () => {
    const { subtitles } = theChoicesOn({
      ...asking,
      subtitles: [aTrack('one', 'English')],
      streams: [aStream(1, 'eng', true)],
    });

    expect(subtitles?.choices).toHaveLength(2);
    expect(subtitles?.choices[0]).toMatchObject({ id: 'off', label: 'Off' });
    expect(subtitles?.choices[1]?.detail).toBe('SRT');
  });

  it('marks the one being read', () => {
    const { subtitles } = theChoicesOn({
      ...asking,
      chosenSubtitle: 'one',
      subtitles: [aTrack('one', 'English')],
      streams: [aStream(1, 'eng', true)],
    });

    expect(subtitles?.chosen).toBe('one');
  });

  it('offers how the lines look while a track is read, and hands back the whole style', () => {
    const onCaptionStyle = jest.fn();
    const { captions } = theChoicesOn({
      ...asking,
      streams: [],
      chosenSubtitle: 'one',
      subtitles: [aTrack('one', 'English')],
      onCaptionStyle,
    });

    expect(captions.map((set) => set.heading)).toEqual(
      expect.arrayContaining(['Font', 'Text colour', 'Background', 'Edge']),
    );

    captions.find((set) => set.heading === 'Size')?.onChoose('150');

    expect(onCaptionStyle).toHaveBeenCalledWith({ ...DEFAULT_CAPTION_STYLE, fontScale: 150 });
  });

  it('offers nothing about how lines look while none is read', () => {
    const { captions } = theChoicesOn({
      ...asking,
      streams: [],
      subtitles: [aTrack('one', 'English')],
    });

    expect(captions).toEqual([]);
  });
});
