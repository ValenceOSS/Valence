import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { SubtitleCues } from './SubtitleCues';
import { DEFAULT_CAPTION_STYLE } from '@ValenceClient/playback/captionStyle';
import type { SubtitleCue, SubtitleSpan } from '@ValenceClient/playback/fetchSubtitleCues';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';

const A_FILE = `WEBVTT

00:00:01.000 --> 00:00:04.000
Hello there

00:00:05.000 --> 00:00:08.000
Later on
`;

const A_LATE_FILE = `WEBVTT

00:00:01.000 --> 00:00:02.500
Too late
`;

const MEDIA_ID = 'film';

type Answer = { status: number; body: string | { cues: SubtitleCue[] } };

const NOT_THERE: Answer = { status: 404, body: '' };

const trackOf = (format: string, id = 'en'): SubtitleTrack => ({
  id,
  language: 'en',
  label: 'English',
  format,
  isForced: false,
  isHearingImpaired: false,
  delivery: 'text',
  streamIndex: 2,
});

const PLAIN = trackOf('srt');

const SCRIPT = trackOf('ass');

const spanOf = (over: Partial<SubtitleSpan> = {}): SubtitleSpan => ({
  text: '',
  fontFamily: null,
  fontHeight: null,
  colour: null,
  opacity: null,
  isBold: false,
  isItalic: false,
  isUnderlined: false,
  isStruckThrough: false,
  ...over,
});

const signOf = (
  span: Partial<SubtitleSpan>,
  over: Partial<SubtitleCue> = {},
  spans?: Partial<SubtitleSpan>[],
): SubtitleCue => ({
  from: 0,
  to: 10,
  spans: (spans ?? [span]).map(spanOf),
  alignment: 7,
  position: null,
  margins: { left: 0, right: 0, vertical: 0 },
  isSign: true,
  ...over,
});

const dialogueOf = (text: string): SubtitleCue => ({
  from: 0,
  to: 10,
  spans: [spanOf({ text })],
  alignment: 2,
  position: null,
  margins: { left: 0, right: 0, vertical: 0 },
  isSign: false,
});

const answerWith = ({ status, body }: Answer): Promise<Response> =>
  Promise.resolve(
    typeof body === 'string' ? new Response(body, { status }) : Response.json(body, { status }),
  );

const serving = (answers: { styled?: Answer[]; plain?: Answer[] }) => {
  const asked = { styled: 0, plain: 0 };

  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const kind = url.includes('/cues') ? 'styled' : 'plain';
      const list = answers[kind] ?? [];
      const next = list[Math.min(asked[kind], list.length - 1)] ?? NOT_THERE;

      asked[kind] += 1;

      return answerWith(next);
    }),
  );

  return asked;
};

const served = (text: string) => serving({ plain: [{ status: 200, body: text }] });

const servedCues = (cues: SubtitleCue[]) =>
  serving({ styled: [{ status: 200, body: { cues } }], plain: [{ status: 200, body: '' }] });

const aVideoAt = (seconds: number) => {
  const element = document.createElement('video');

  Object.defineProperty(element, 'currentTime', {
    configurable: true,
    writable: true,
    value: seconds,
  });

  return { current: element };
};

const aVideoShowing = (width: number, height: number) => {
  const video = aVideoAt(2);

  Object.defineProperty(video.current, 'videoWidth', { configurable: true, value: width });
  Object.defineProperty(video.current, 'videoHeight', { configurable: true, value: height });

  return video;
};

const framesGoBy = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 120);
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SubtitleCues', () => {
  it('draws what is being said', async () => {
    served(A_FILE);

    render(
      <SubtitleCues mediaId={MEDIA_ID} track={PLAIN} atSeconds={2} style={DEFAULT_CAPTION_STYLE} />,
      { wrapper: CacheScope },
    );

    expect(await screen.findByText('Hello there')).toBeInTheDocument();
  });

  it('draws nothing where nobody is speaking', async () => {
    served(A_FILE);

    const drawn = render(
      <SubtitleCues mediaId={MEDIA_ID} track={PLAIN} atSeconds={2} style={DEFAULT_CAPTION_STYLE} />,
      { wrapper: CacheScope },
    );

    await screen.findByText('Hello there');

    drawn.rerender(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={PLAIN}
        atSeconds={4.5}
        style={DEFAULT_CAPTION_STYLE}
      />,
    );

    expect(drawn.container).toBeEmptyDOMElement();
  });

  it('follows the film as it plays', async () => {
    served(A_FILE);

    const drawn = render(
      <SubtitleCues mediaId={MEDIA_ID} track={PLAIN} atSeconds={2} style={DEFAULT_CAPTION_STYLE} />,
      { wrapper: CacheScope },
    );

    await screen.findByText('Hello there');

    drawn.rerender(
      <SubtitleCues mediaId={MEDIA_ID} track={PLAIN} atSeconds={6} style={DEFAULT_CAPTION_STYLE} />,
    );

    expect(screen.getByText('Later on')).toBeInTheDocument();
  });

  it('follows the clock of the video it is drawn over, between the player’s reports', async () => {
    served(A_FILE);
    const video = aVideoAt(2);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={PLAIN}
        atSeconds={2}
        video={video}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    await screen.findByText('Hello there');

    video.current.currentTime = 6;

    expect(await screen.findByText('Later on')).toBeInTheDocument();
    expect(screen.queryByText('Hello there')).not.toBeInTheDocument();
  });

  it('lets go of a line as soon as the timing is nudged past it', async () => {
    served(A_FILE);
    const video = aVideoAt(2);

    const drawn = render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={PLAIN}
        atSeconds={2}
        video={video}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    await screen.findByText('Hello there');
    await framesGoBy();

    drawn.rerender(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={PLAIN}
        atSeconds={4.5}
        video={video}
        offsetSeconds={-2.5}
        style={DEFAULT_CAPTION_STYLE}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Hello there')).not.toBeInTheDocument();
    });
  });

  it('never draws a newly chosen track at a moment the film has already left', async () => {
    const asked: string[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        asked.push(url);

        return answerWith({
          status: 200,
          body: url.includes('/subtitles/second') ? A_LATE_FILE : A_FILE,
        });
      }),
    );
    const video = aVideoAt(2);

    const drawn = render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={trackOf('srt', 'first')}
        atSeconds={2}
        video={video}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    await screen.findByText('Hello there');
    await framesGoBy();

    video.current.currentTime = 3;
    await framesGoBy();

    drawn.rerender(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={trackOf('srt', 'second')}
        atSeconds={3}
        video={video}
        style={DEFAULT_CAPTION_STYLE}
      />,
    );

    await waitFor(() => {
      expect(asked.some((url) => url.includes('/subtitles/second'))).toBe(true);
    });
    await framesGoBy();

    expect(screen.queryByText('Too late')).not.toBeInTheDocument();
    expect(screen.queryByText('Hello there')).not.toBeInTheDocument();
  });

  it('sits above the controls while they are up', async () => {
    served(A_FILE);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={PLAIN}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
        isLifted
      />,
      { wrapper: CacheScope },
    );

    const line = await screen.findByText('Hello there');

    expect(line.parentElement).toHaveStyle({ bottom: '18%' });
  });

  it('sits lower once they go away', async () => {
    served(A_FILE);

    render(
      <SubtitleCues mediaId={MEDIA_ID} track={PLAIN} atSeconds={2} style={DEFAULT_CAPTION_STYLE} />,
      { wrapper: CacheScope },
    );

    const line = await screen.findByText('Hello there');

    expect(line.parentElement).toHaveStyle({ bottom: '8%' });
  });

  it('draws them the way this viewer likes captions drawn', async () => {
    served(A_FILE);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={PLAIN}
        atSeconds={2}
        style={{ ...DEFAULT_CAPTION_STYLE, color: '#ff0000', opacity: 1 }}
      />,
      { wrapper: CacheScope },
    );

    expect(await screen.findByText('Hello there')).toHaveStyle({ color: 'rgba(255, 0, 0, 1)' });
  });

  it('draws the lines once the server can read the track, rather than leaving it blank', async () => {
    serving({
      plain: [
        { status: 503, body: '' },
        { status: 200, body: A_FILE },
      ],
    });

    render(
      <SubtitleCues mediaId={MEDIA_ID} track={PLAIN} atSeconds={2} style={DEFAULT_CAPTION_STYLE} />,
      { wrapper: CacheScope },
    );

    expect(await screen.findByText('Hello there')).toBeInTheDocument();
  });

  it('draws a sign where the script put it, rather than down with the dialogue', async () => {
    servedCues([
      signOf({ text: 'CLOSED' }, { position: { x: 0.75, y: 0.2 }, alignment: 7 }),
      dialogueOf('I will be back by six.'),
    ]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    const sign = await screen.findByText('CLOSED');

    expect(sign.closest('div')).toHaveStyle({ left: '75%', top: '20%' });
  });

  it('lets a placed sign be as wide as its words, without the rows’ margins', async () => {
    servedCues([signOf({ text: 'OPEN ALL HOURS' }, { position: { x: 0.885, y: 0.5 } })]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    const box = (await screen.findByText('OPEN ALL HOURS')).closest('div');

    expect(box).toHaveStyle({ width: 'max-content' });
    expect(box).not.toHaveClass('px-[8%]');
  });

  it('shows a sign and the talking over it at once', async () => {
    servedCues([signOf({ text: 'CLOSED' }), dialogueOf('I will be back by six.')]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    expect(await screen.findByText('CLOSED')).toBeInTheDocument();
    expect(screen.getByText('I will be back by six.')).toBeInTheDocument();
  });

  it('stacks two lines said at once at the foot, the later above the earlier, rather than one on the other', async () => {
    servedCues([dialogueOf('Who is there?'), dialogueOf('Only me.')]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    const first = await screen.findByText('Who is there?');
    const second = screen.getByText('Only me.');

    expect(first.parentElement).toBe(second.parentElement);
    expect(first.nextElementSibling).toBe(second);
    expect(first.parentElement).toHaveClass('flex-col-reverse', 'px-[8%]');
    expect(first.parentElement).not.toHaveClass('flex-col');
  });

  it('stacks two lines meant for the top downwards, in the script’s order', async () => {
    servedCues([
      signOf({ text: 'Episode 4' }, { alignment: 8 }),
      signOf({ text: 'The Return' }, { alignment: 8 }),
    ]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    const first = (await screen.findByText('Episode 4')).closest('p');
    const second = screen.getByText('The Return').closest('p');

    expect(first?.nextElementSibling).toBe(second);
    expect(first?.parentElement).toHaveClass('flex-col');
    expect(first?.parentElement).not.toHaveClass('flex-col-reverse');
  });

  it('puts a line meant for the top of the picture along the top', async () => {
    servedCues([signOf({ text: 'Episode 4' }, { alignment: 8 })]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    const line = (await screen.findByText('Episode 4')).closest('p');

    expect(line?.parentElement).toHaveStyle({ top: '8%' });
  });

  it('keeps the top row clear of the controls while they are up', async () => {
    servedCues([signOf({ text: 'Episode 4' }, { alignment: 8 })]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
        isLifted
      />,
      { wrapper: CacheScope },
    );

    const line = (await screen.findByText('Episode 4')).closest('p');

    expect(line?.parentElement).toHaveStyle({ top: '18%' });
  });

  it('puts two lines meant for the top in the one row there', async () => {
    servedCues([
      signOf({ text: 'Episode 4' }, { alignment: 8 }),
      signOf({ text: 'The Return' }, { alignment: 8 }),
    ]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    const first = (await screen.findByText('Episode 4')).closest('p');
    const second = screen.getByText('The Return').closest('p');

    expect(first?.parentElement).toBe(second?.parentElement);
  });

  it('centres a line meant for the middle of the picture', async () => {
    servedCues([signOf({ text: 'Meanwhile' }, { alignment: 5 })]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    const line = (await screen.findByText('Meanwhile')).closest('p');

    expect(line?.parentElement).toHaveStyle({ top: '50%', transform: 'translateY(-50%)' });
  });

  it('draws a line the script layered several times over only once', async () => {
    servedCues([signOf({ text: 'CLOSED' }), signOf({ text: 'CLOSED' })]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    await screen.findByText('CLOSED');

    expect(screen.getAllByText('CLOSED')).toHaveLength(1);
  });

  it('dresses a sign the way the script asked', async () => {
    servedCues([signOf({ text: 'CLOSED', colour: '#ff0000', isBold: true })]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    expect(await screen.findByText('CLOSED')).toHaveStyle({
      color: '#ff0000',
      fontWeight: '700',
    });
  });

  it('splits a line where the script changed it partway', async () => {
    servedCues([
      signOf({ text: 'plain ' }, {}, [{ text: 'plain ' }, { text: 'italic', isItalic: true }]),
    ]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    expect(await screen.findByText('italic')).toHaveStyle({ fontStyle: 'italic' });
    expect(screen.getByText('plain')).toHaveStyle({ fontStyle: 'normal' });
  });

  it('reads the file as WebVTT where the track carries no styling of its own', async () => {
    serving({ styled: [NOT_THERE], plain: [{ status: 200, body: A_FILE }] });

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    expect(await screen.findByText('Hello there')).toBeInTheDocument();
  });

  it('leaves dialogue in the viewer’s own lettering, whatever a script would prefer', async () => {
    servedCues([dialogueOf('I will be back by six.')]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={{ ...DEFAULT_CAPTION_STYLE, color: '#ffff00' }}
      />,
      { wrapper: CacheScope },
    );

    const line = await screen.findByText('I will be back by six.');

    expect(line).toHaveStyle({ color: 'rgba(255, 255, 0, 1)' });
  });

  it('places a sign on the picture, rather than across the bars of a player that is not its shape', async () => {
    servedCues([signOf({ text: 'CLOSED' }, { position: { x: 0.75, y: 0.2 } })]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        video={aVideoShowing(1920, 800)}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    const picture = (await screen.findByText('CLOSED')).closest('div')?.parentElement;

    expect(picture).toHaveClass('absolute', '[container-type:size]');
    await waitFor(() => {
      expect(picture).toHaveStyle({
        left: '50%',
        top: '50%',
        width: 'min(100cqw, calc(100cqh * 2.4))',
        height: 'min(100cqh, calc(100cqw / 2.4))',
        transform: 'translate(-50%, -50%)',
      });
    });
  });

  it('places a sign on the picture the engine draws, where the video carries only the sound', async () => {
    servedCues([signOf({ text: 'CLOSED' }, { position: { x: 0.75, y: 0.2 } })]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        video={aVideoShowing(0, 0)}
        picture={{ current: { width: 720, height: 576 } }}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    const picture = (await screen.findByText('CLOSED')).closest('div')?.parentElement;

    await waitFor(() => {
      expect(picture).toHaveStyle({
        width: 'min(100cqw, calc(100cqh * 1.25))',
        height: 'min(100cqh, calc(100cqw / 1.25))',
      });
    });
  });

  it('places a sign across the whole player while the picture’s shape is not known', async () => {
    servedCues([signOf({ text: 'CLOSED' }, { position: { x: 0.75, y: 0.2 } })]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    const picture = (await screen.findByText('CLOSED')).closest('div')?.parentElement;

    expect(picture).toHaveStyle({ inset: '0px' });
    expect(picture?.style.width).toBe('');
  });

  it('keeps the rows on the whole player, where the controls they keep clear of are', async () => {
    servedCues([
      signOf({ text: 'CLOSED' }, { position: { x: 0.75, y: 0.2 } }),
      dialogueOf('I will be back by six.'),
    ]);

    render(
      <SubtitleCues
        mediaId={MEDIA_ID}
        track={SCRIPT}
        atSeconds={2}
        video={aVideoShowing(1920, 800)}
        style={DEFAULT_CAPTION_STYLE}
      />,
      { wrapper: CacheScope },
    );

    const row = (await screen.findByText('I will be back by six.')).parentElement;
    const picture = screen.getByText('CLOSED').closest('div')?.parentElement;

    expect(row?.parentElement).toBe(picture?.parentElement);
    expect(row?.parentElement).toHaveClass('inset-0', '[container-type:size]');
  });
});
