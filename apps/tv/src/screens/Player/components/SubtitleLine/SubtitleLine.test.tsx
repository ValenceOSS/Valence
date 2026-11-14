import { act, render } from '@testing-library/react-native';
import { DEFAULT_CAPTION_STYLE } from '@ValenceClient/playback/captionStyle';
import { SubtitleLine } from '@ValenceTv/screens/Player/components/SubtitleLine/SubtitleLine';
import type { SubtitleCue, SubtitleSpan } from '@ValenceClient/playback/fetchSubtitleCues';

const aSpan = (text: string, change: Partial<SubtitleSpan> = {}): SubtitleSpan => ({
  text,
  fontFamily: null,
  fontHeight: null,
  colour: null,
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
  spans: SubtitleSpan[],
  change: Partial<SubtitleCue> = {},
): SubtitleCue => ({
  from,
  to,
  spans,
  alignment: 2,
  position: null,
  margins: { left: 0, right: 0, vertical: 0 },
  isSign: false,
  ...change,
});

const CUES = [
  aCue(10, 12, [aSpan('Where are you going?')]),
  aCue(11, 14, [
    aSpan('Home', { isBold: true }),
    aSpan(', ', {}),
    aSpan('now', { isItalic: true }),
  ]),
  aCue(11, 13, [aSpan('EXIT')], { isSign: true, alignment: 7, position: { x: 0.1, y: 0.2 } }),
  aCue(20, 22, [aSpan('Later on')]),
];

describe('SubtitleLine', () => {
  it('draws nothing when no line is due', async () => {
    const drawn = await render(
      <SubtitleLine
        cues={CUES}
        position={5}
        isPlaying={false}
        isLifted={false}
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );

    expect(drawn.toJSON()).toBeNull();
  });

  it('shows every line due at the moment, the signs placed at a point among them', async () => {
    const drawn = await render(
      <SubtitleLine
        cues={CUES}
        position={11.5}
        isPlaying={false}
        isLifted={false}
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );

    expect(drawn.getByText('Where are you going?')).toBeTruthy();
    expect(drawn.getByText('Home, now')).toBeTruthy();
    expect(drawn.getByText('EXIT')).toBeTruthy();
    expect(drawn.queryByText('Later on')).toBeNull();
  });

  it('draws a sign placed at a point at the end of the row its alignment names, as every line is drawn', async () => {
    const drawn = await render(
      <SubtitleLine
        cues={[
          aCue(10, 12, [aSpan('EXIT', { colour: '#ff0000', fontHeight: 0.2 })], {
            isSign: true,
            alignment: 7,
            position: { x: 0.1, y: 0.2 },
          }),
          aCue(10, 12, [aSpan('Up top')], { alignment: 8 }),
          aCue(10, 12, [aSpan('Speaking')]),
        ]}
        position={11}
        isPlaying={false}
        isLifted={false}
        captionStyle={{ ...DEFAULT_CAPTION_STYLE, color: '#ffff00' }}
      />,
    );
    const sign = drawn.getByText('EXIT').parent;
    const top = drawn.getByText('Up top').parent;

    expect(sign?.parent).toBe(top?.parent);
    expect(top?.parent?.children[0]).toBe(top);
    expect(top?.parent?.children[1]).toBe(sign);
    expect(sign?.parent).not.toBe(drawn.getByText('Speaking').parent?.parent);
    expect(sign).toHaveStyle({ color: 'rgba(255, 255, 0, 1)', fontSize: 36 });
    expect(drawn.getByText('EXIT')).not.toHaveStyle({ color: '#ff0000' });
  });

  it('draws dialogue the script moved to a point of its own in the row its alignment names', async () => {
    const drawn = await render(
      <SubtitleLine
        cues={[
          aCue(10, 12, [aSpan('Speaking')]),
          aCue(10, 12, [aSpan('Over here')], { position: { x: 0.5, y: 0.9 } }),
          aCue(10, 12, [aSpan('Midway')], { alignment: 5, position: { x: 0.5, y: 0.5 } }),
        ]}
        position={11}
        isPlaying={false}
        isLifted={false}
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );

    expect(drawn.getByText('Over here').parent?.parent).toBe(
      drawn.getByText('Speaking').parent?.parent,
    );
    expect(drawn.getByText('Midway').parent?.parent).toHaveStyle({
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    });
  });

  it('stacks the lines at the foot upwards, the earliest lowest, so a line being read stays put', async () => {
    const drawn = await render(
      <SubtitleLine
        cues={[aCue(10, 14, [aSpan('First speaker')]), aCue(11, 13, [aSpan('Second speaker')])]}
        position={12}
        isPlaying={false}
        isLifted={false}
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );
    const first = drawn.getByText('First speaker').parent;

    expect(first?.parent?.children).toHaveLength(2);
    expect(first?.parent?.children[0]).toBe(drawn.getByText('Second speaker').parent);
    expect(first?.parent?.children[1]).toBe(first);
  });

  it('stacks the lines at the top downwards, in the order the script has them', async () => {
    const drawn = await render(
      <SubtitleLine
        cues={[
          aCue(10, 14, [aSpan('First up top')], { alignment: 8 }),
          aCue(11, 13, [aSpan('Next up top')], { alignment: 8 }),
        ]}
        position={12}
        isPlaying={false}
        isLifted={false}
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );
    const first = drawn.getByText('First up top').parent;

    expect(first?.parent?.children[0]).toBe(first);
    expect(first?.parent?.children[1]).toBe(drawn.getByText('Next up top').parent);
  });

  it('keeps each line of a row to the side its alignment names', async () => {
    const drawn = await render(
      <SubtitleLine
        cues={[
          aCue(10, 12, [aSpan('On the left')], { alignment: 1 }),
          aCue(10, 12, [aSpan('In the middle')]),
          aCue(10, 12, [aSpan('On the right')], { alignment: 3 }),
          aCue(10, 12, [aSpan('Up on the right')], { alignment: 9 }),
        ]}
        position={11}
        isPlaying={false}
        isLifted={false}
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
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

  it('draws a line aligned to the top in a row at the top, apart from the lines at the foot', async () => {
    const drawn = await render(
      <SubtitleLine
        cues={[
          aCue(10, 12, [aSpan('Speaking')]),
          aCue(10, 12, [aSpan('Up top')], { isSign: true, alignment: 8 }),
        ]}
        position={11}
        isPlaying={false}
        isLifted={false}
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );
    const top = drawn.getByText('Up top').parent?.parent;

    expect(top).not.toBe(drawn.getByText('Speaking').parent?.parent);
    expect(top).toHaveStyle({ top: 64 });
  });

  it('moves the row at the top below the title while the controls are showing', async () => {
    const drawn = await render(
      <SubtitleLine
        cues={[aCue(10, 12, [aSpan('Up top')], { alignment: 8 })]}
        position={11}
        isPlaying={false}
        isLifted
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );

    expect(drawn.getByText('Up top').parent?.parent).toHaveStyle({ top: 220 });
  });

  it('draws a line aligned to the middle in a row in the middle', async () => {
    const drawn = await render(
      <SubtitleLine
        cues={[
          aCue(10, 12, [aSpan('Speaking')]),
          aCue(10, 12, [aSpan('Midway')], { alignment: 5 }),
        ]}
        position={11}
        isPlaying={false}
        isLifted={false}
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );
    const middle = drawn.getByText('Midway').parent?.parent;

    expect(middle).not.toBe(drawn.getByText('Speaking').parent?.parent);
    expect(middle).toHaveStyle({ top: 0, bottom: 0, justifyContent: 'center' });
  });

  it('stacks the lines of a row in one column, so two said at once never sit on each other', async () => {
    const drawn = await render(
      <SubtitleLine
        cues={CUES}
        position={11.5}
        isPlaying={false}
        isLifted={false}
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );

    expect(drawn.getByText('Where are you going?').parent?.parent).toBe(
      drawn.getByText('Home').parent?.parent,
    );
  });

  it('draws two different lines with the same times as two lines', async () => {
    const said = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      const drawn = await render(
        <SubtitleLine
          cues={[aCue(10, 12, [aSpan('One voice')]), aCue(10, 12, [aSpan('Another voice')])]}
          position={11}
          isPlaying={false}
          isLifted={false}
          captionStyle={DEFAULT_CAPTION_STYLE}
        />,
      );

      expect(drawn.getByText('One voice')).toBeTruthy();
      expect(drawn.getByText('Another voice')).toBeTruthy();
      expect(said.mock.calls.flat().join(' ')).not.toMatch(/same key/u);
    } finally {
      said.mockRestore();
    }
  });

  it('shows a line from its start up to but not at its end', async () => {
    const atStart = await render(
      <SubtitleLine
        cues={CUES}
        position={20}
        isPlaying={false}
        isLifted={false}
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );

    expect(atStart.getByText('Later on')).toBeTruthy();

    const atEnd = await render(
      <SubtitleLine
        cues={CUES}
        position={22}
        isPlaying={false}
        isLifted={false}
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );

    expect(atEnd.queryByText('Later on')).toBeNull();
  });

  it('draws each part in the weight and slant the track gave it', async () => {
    const drawn = await render(
      <SubtitleLine
        cues={CUES}
        position={13}
        isPlaying={false}
        isLifted={false}
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );

    expect(drawn.getByText('Home')).toHaveStyle({ fontWeight: '800' });
    expect(drawn.getByText('now')).toHaveStyle({ fontStyle: 'italic' });
    expect(drawn.getByText('now')).not.toHaveStyle({ fontWeight: '800' });
  });

  it('rises above the controls while they are showing', async () => {
    const low = await render(
      <SubtitleLine
        cues={CUES}
        position={20}
        isPlaying={false}
        isLifted={false}
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );
    const lifted = await render(
      <SubtitleLine
        cues={CUES}
        position={20}
        isPlaying={false}
        isLifted
        captionStyle={DEFAULT_CAPTION_STYLE}
      />,
    );
    const lineOf = (drawn: typeof low) => drawn.getByText('Later on').parent?.parent ?? null;

    expect(lineOf(low)).not.toHaveStyle({ bottom: 300 });
    expect(lineOf(lifted)).toHaveStyle({ bottom: 300 });
  });

  it('draws the lines as this television has been set to', async () => {
    const drawn = await render(
      <SubtitleLine
        cues={CUES}
        position={11.5}
        isPlaying={false}
        isLifted={false}
        captionStyle={{ ...DEFAULT_CAPTION_STYLE, color: '#ffff00', backgroundOpacity: 0 }}
      />,
    );

    expect(drawn.getByText('Where are you going?').parent).toHaveStyle({
      color: 'rgba(255, 255, 0, 1)',
      backgroundColor: 'rgba(0, 0, 0, 0)',
    });
  });

  it('puts a line up at its own moment while playing, not at the next report', async () => {
    jest.useFakeTimers();

    try {
      const drawn = await render(
        <SubtitleLine
          cues={CUES}
          position={19.6}
          isPlaying
          isLifted={false}
          captionStyle={DEFAULT_CAPTION_STYLE}
        />,
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

  it('runs no more than a second past the last report, so a stalled picture keeps its words', async () => {
    jest.useFakeTimers();

    try {
      const drawn = await render(
        <SubtitleLine
          cues={CUES}
          position={18.5}
          isPlaying
          isLifted={false}
          captionStyle={DEFAULT_CAPTION_STYLE}
        />,
      );

      await act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(drawn.queryByText('Later on')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
