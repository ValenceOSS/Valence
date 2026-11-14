import { act, render } from '@testing-library/react-native';
import { DEFAULT_CAPTION_STYLE } from '@ValenceClient/playback/captionStyle';
import { TheSubtitles } from './TheSubtitles';
import type { SubtitleCue, SubtitleSpan } from '@ValenceClient/playback/fetchSubtitleCues';
import type { TheSubtitlesProps } from './TheSubtitles.types';

const SCREEN = { width: 800, height: 400 };

const FRAME = { left: 100, top: 0, width: 600, height: 400 };

const aSpan = (text: string, change: Partial<SubtitleSpan> = {}): SubtitleSpan => ({
  text,
  colour: null,
  fontFamily: null,
  fontHeight: null,
  opacity: null,
  isBold: false,
  isItalic: false,
  isUnderlined: false,
  isStruckThrough: false,
  ...change,
});

const aCue = (
  from: number,
  to: number,
  text: string,
  change: Partial<SubtitleCue> = {},
): SubtitleCue => ({
  from,
  to,
  spans: [aSpan(text)],
  alignment: 2,
  position: null,
  margins: { left: 0, right: 0, vertical: 0 },
  isSign: false,
  ...change,
});

const drawing = (change: Partial<TheSubtitlesProps> = {}) => (
  <TheSubtitles
    cues={[]}
    atSeconds={2}
    isPlaying={false}
    isClearOfTheControls={false}
    captionStyle={DEFAULT_CAPTION_STYLE}
    frame={FRAME}
    screen={SCREEN}
    {...change}
  />
);

describe('TheSubtitles', () => {
  it('draws the line being spoken', async () => {
    const drawn = await render(drawing({ cues: [aCue(0, 4, 'Hello there')] }));

    expect(drawn.getByText('Hello there')).toBeTruthy();
  });

  it('draws nothing in a silence', async () => {
    const drawn = await render(drawing({ cues: [aCue(0, 4, 'Hello there')], atSeconds: 9 }));

    expect(drawn.queryByText('Hello there')).toBeNull();
  });

  it('stacks the lines at the foot in one column, so two said at once never sit on each other', async () => {
    const drawn = await render(
      drawing({ cues: [aCue(0, 4, 'First speaker'), aCue(1, 3, 'Second speaker')] }),
    );
    const column = drawn.getByText('First speaker').parent?.parent;

    expect(drawn.getByText('Second speaker').parent?.parent).toBe(column);
    expect(column).toHaveStyle({ bottom: '8%' });
  });

  it('stacks the lines at the foot upwards, the earliest lowest, so a line being read stays put', async () => {
    const drawn = await render(
      drawing({ cues: [aCue(0, 4, 'First speaker'), aCue(1, 3, 'Second speaker')] }),
    );
    const first = drawn.getByText('First speaker').parent;
    const second = drawn.getByText('Second speaker').parent;

    expect(first?.parent?.children).toHaveLength(2);
    expect(first?.parent?.children[0]).toBe(second);
    expect(first?.parent?.children[1]).toBe(first);
  });

  it('stacks the lines at the top downwards, in the order the script has them', async () => {
    const drawn = await render(
      drawing({
        cues: [
          aCue(0, 4, 'First up top', { alignment: 8 }),
          aCue(1, 3, 'Next up top', { alignment: 8 }),
        ],
      }),
    );
    const first = drawn.getByText('First up top').parent;

    expect(first?.parent?.children[0]).toBe(first);
    expect(first?.parent?.children[1]).toBe(drawn.getByText('Next up top').parent);
  });

  it('keeps each line of a row to the side its alignment names', async () => {
    const drawn = await render(
      drawing({
        cues: [
          aCue(0, 4, 'On the left', { alignment: 1 }),
          aCue(0, 4, 'In the middle'),
          aCue(0, 4, 'On the right', { alignment: 3 }),
          aCue(0, 4, 'Up on the right', { alignment: 9 }),
        ],
      }),
    );

    expect(drawn.getByText('On the left').parent).toHaveStyle({
      alignSelf: 'flex-start',
      textAlign: 'left',
    });
    expect(drawn.getByText('In the middle').parent).toHaveStyle({
      alignSelf: 'center',
      textAlign: 'center',
    });
    expect(drawn.getByText('On the right').parent).toHaveStyle({
      alignSelf: 'flex-end',
      textAlign: 'right',
    });
    expect(drawn.getByText('Up on the right').parent).toHaveStyle({
      alignSelf: 'flex-end',
      textAlign: 'right',
    });
  });

  it('lifts the lines at the foot clear of the controls while they are up', async () => {
    const drawn = await render(
      drawing({ cues: [aCue(0, 4, 'Hello there')], isClearOfTheControls: true }),
    );

    expect(drawn.getByText('Hello there').parent?.parent).toHaveStyle({ bottom: '22%' });
  });

  it('draws a line aligned to the top in a row at the top, clear of the notch', async () => {
    const drawn = await render(
      drawing({ cues: [aCue(0, 4, 'Speaking'), aCue(1, 3, 'Up top', { alignment: 8 })] }),
    );
    const top = drawn.getByText('Up top').parent?.parent;

    expect(top).not.toBe(drawn.getByText('Speaking').parent?.parent);
    expect(top).toHaveStyle({ top: 59 });
  });

  it('moves the row at the top down clear of the controls while they are up', async () => {
    const drawn = await render(
      drawing({ cues: [aCue(0, 4, 'Up top', { alignment: 8 })], isClearOfTheControls: true }),
    );

    expect(drawn.getByText('Up top').parent?.parent).toHaveStyle({ top: 88 });
  });

  it('draws a line aligned to the middle in a row of its own in the middle', async () => {
    const drawn = await render(
      drawing({ cues: [aCue(0, 4, 'Speaking'), aCue(1, 3, 'Midway', { alignment: 5 })] }),
    );
    const middle = drawn.getByText('Midway').parent?.parent;

    expect(middle).not.toBe(drawn.getByText('Speaking').parent?.parent);
    expect(middle).toHaveStyle({ top: 0, bottom: 0, justifyContent: 'center' });
  });

  it('draws the lines of the middle row at the end of the top row while the controls are up', async () => {
    const drawn = await render(
      drawing({
        cues: [aCue(0, 4, 'Midway', { alignment: 5 }), aCue(1, 3, 'Up top', { alignment: 8 })],
        isClearOfTheControls: true,
      }),
    );
    const top = drawn.getByText('Up top').parent;

    expect(top?.parent).toHaveStyle({ top: 88 });
    expect(top?.parent?.children[0]).toBe(top);
    expect(top?.parent?.children[1]).toBe(drawn.getByText('Midway').parent);
  });

  it('draws the middle row at the top on its own while the controls are up, clear of the button', async () => {
    const drawn = await render(
      drawing({ cues: [aCue(0, 4, 'Midway', { alignment: 5 })], isClearOfTheControls: true }),
    );
    const row = drawn.getByText('Midway').parent?.parent;

    expect(row).toHaveStyle({ top: 88 });
    expect(row).not.toHaveStyle({ justifyContent: 'center' });
  });

  it('draws a line the script put at a point at that point of the frame on screen', async () => {
    const drawn = await render(
      drawing({
        cues: [
          aCue(0, 4, 'Speaking'),
          aCue(1, 3, 'EXIT', { position: { x: 0.25, y: 0.5 }, alignment: 7 }),
        ],
      }),
    );
    const sign = drawn.getByText('EXIT').parent?.parent;

    expect(sign).not.toBe(drawn.getByText('Speaking').parent?.parent);
    expect(sign).toHaveStyle({ position: 'absolute', left: 250, maxWidth: 550, top: 200 });
  });

  it('places a line on the whole screen until the frame’s size is known', async () => {
    const drawn = await render(
      drawing({
        cues: [aCue(1, 3, 'EXIT', { position: { x: 0.5, y: 0.5 }, alignment: 7 })],
        frame: null,
      }),
    );

    expect(drawn.getByText('EXIT').parent?.parent).toHaveStyle({ left: 400, top: 200 });
  });

  it('draws a placed line in the script’s colour and size, outlined rather than boxed', async () => {
    const sign = aCue(1, 3, 'EXIT', { position: { x: 0.5, y: 0.5 }, alignment: 5 });

    sign.spans = [aSpan('EXIT', { colour: '#ff0000', opacity: 0.5, fontHeight: 0.05 })];

    const drawn = await render(drawing({ cues: [sign] }));

    expect(drawn.getByText('EXIT')).toHaveStyle({
      color: 'rgba(255, 0, 0, 0.5)',
      fontSize: 20,
      textShadowRadius: 3,
    });
    expect(drawn.getByText('EXIT').parent).toHaveStyle({ backgroundColor: 'transparent' });
  });

  it('outlines a placed line dark round light lettering and light round dark', async () => {
    const dark = aCue(1, 3, 'Dark', { position: { x: 0.2, y: 0.2 }, alignment: 7 });
    const light = aCue(1, 3, 'Light', { position: { x: 0.8, y: 0.8 }, alignment: 3 });
    const faded = aCue(1, 3, 'Faded', { position: { x: 0.5, y: 0.5 }, alignment: 5 });
    const plain = aCue(1, 3, 'Plain', { position: { x: 0.2, y: 0.8 }, alignment: 1 });

    dark.spans = [aSpan('Dark', { colour: '#101010' })];
    light.spans = [aSpan('Light', { colour: '#ffff00' })];
    faded.spans = [aSpan('Faded', { colour: '#ffffff', opacity: 0.5 })];

    const drawn = await render(drawing({ cues: [dark, light, faded, plain] }));

    expect(drawn.getByText('Dark')).toHaveStyle({ textShadowColor: 'rgba(255, 255, 255, 0.9)' });
    expect(drawn.getByText('Light')).toHaveStyle({ textShadowColor: 'rgba(0, 0, 0, 0.9)' });
    expect(drawn.getByText('Faded')).toHaveStyle({ textShadowColor: 'rgba(0, 0, 0, 0.45)' });
    expect(drawn.getByText('Plain')).toHaveStyle({ textShadowColor: 'rgba(0, 0, 0, 0.9)' });
  });

  it('keeps a placed line readable and off most of the picture, whatever size the script asked', async () => {
    const tiny = aCue(1, 3, 'Tiny', { position: { x: 0.2, y: 0.2 }, alignment: 7 });
    const huge = aCue(1, 3, 'Huge', { position: { x: 0.8, y: 0.8 }, alignment: 3 });

    tiny.spans = [aSpan('Tiny', { fontHeight: 0.001 })];
    huge.spans = [aSpan('Huge', { fontHeight: 0.6 })];

    const drawn = await render(drawing({ cues: [tiny, huge] }));

    expect(drawn.getByText('Tiny')).toHaveStyle({ fontSize: 11 });
    expect(drawn.getByText('Huge')).toHaveStyle({ fontSize: 48 });
  });

  it('draws a placed line the script left uncoloured in this phone’s colour and size', async () => {
    const drawn = await render(
      drawing({
        cues: [aCue(1, 3, 'EXIT', { position: { x: 0.5, y: 0.5 }, alignment: 5 })],
        captionStyle: { ...DEFAULT_CAPTION_STYLE, color: '#ffff00' },
      }),
    );

    expect(drawn.getByText('EXIT')).toHaveStyle({ color: 'rgba(255, 255, 0, 1)', fontSize: 19 });
  });

  it('draws a line in a row in this phone’s colours, never the colour the script gave it', async () => {
    const dark = aCue(0, 4, 'Dark words');

    dark.spans = [aSpan('Dark words', { colour: '#000000' })];

    const drawn = await render(
      drawing({
        cues: [dark],
        captionStyle: { ...DEFAULT_CAPTION_STYLE, color: '#ffff00' },
      }),
    );

    expect(drawn.getByText('Dark words').parent).toHaveStyle({ color: 'rgba(255, 255, 0, 1)' });
    expect(drawn.getByText('Dark words')).not.toHaveStyle({ color: '#000000' });
  });

  it('joins the pieces of a line that changed colour part way through', async () => {
    const two = aCue(0, 4, 'One ');

    two.spans.push(aSpan('two'));

    const drawn = await render(drawing({ cues: [two] }));

    expect(drawn.getByText('One two')).toBeTruthy();
  });

  it('draws each part in the weight and slant the track gave it', async () => {
    const mixed = aCue(0, 4, '');

    mixed.spans = [aSpan('Home', { isBold: true }), aSpan(', '), aSpan('now', { isItalic: true })];

    const drawn = await render(drawing({ cues: [mixed] }));

    expect(drawn.getByText('Home')).toHaveStyle({ fontWeight: '700' });
    expect(drawn.getByText('now')).toHaveStyle({ fontStyle: 'italic' });
    expect(drawn.getByText('now')).not.toHaveStyle({ fontWeight: '700' });
  });

  it('draws two different lines with the same times as two lines', async () => {
    const said = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      const drawn = await render(
        drawing({ cues: [aCue(0, 4, 'One voice'), aCue(0, 4, 'Another voice')] }),
      );

      expect(drawn.getByText('One voice')).toBeTruthy();
      expect(drawn.getByText('Another voice')).toBeTruthy();
      expect(said.mock.calls.flat().join(' ')).not.toMatch(/same key/u);
    } finally {
      said.mockRestore();
    }
  });

  it('never takes a touch meant for the film behind it', async () => {
    const drawn = await render(drawing({ cues: [aCue(0, 4, 'Hello there')] }));

    expect(drawn.getByText('Hello there').parent?.parent?.parent).toHaveProp(
      'pointerEvents',
      'none',
    );
    expect(drawn.queryByRole('button')).toBeNull();
  });

  it('draws nothing at all for a track with nothing in it', async () => {
    const drawn = await render(drawing());

    expect(drawn.toJSON()).toBeNull();
  });

  it('draws the lines as this phone likes them, at a size taken from its own', async () => {
    const drawn = await render(
      drawing({
        cues: [aCue(1, 3, 'Hello')],
        captionStyle: { ...DEFAULT_CAPTION_STYLE, fontScale: 200, color: '#ffff00' },
      }),
    );

    expect(drawn.getByText('Hello').parent).toHaveStyle({
      fontSize: 38,
      color: 'rgba(255, 255, 0, 1)',
    });
  });

  it('puts a line up at its own moment while the film plays, not at the next report', async () => {
    jest.useFakeTimers();

    try {
      const drawn = await render(
        drawing({ cues: [aCue(20, 22, 'Later on')], atSeconds: 19.6, isPlaying: true }),
      );

      expect(drawn.queryByText('Later on')).toBeNull();

      await act(() => {
        jest.advanceTimersByTime(450);
      });

      expect(drawn.getByText('Later on')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });
});
