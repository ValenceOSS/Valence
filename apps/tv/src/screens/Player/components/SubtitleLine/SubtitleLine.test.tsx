import { render } from '@testing-library/react-native';
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

const aCue = (from: number, to: number, spans: SubtitleSpan[], isSign = false): SubtitleCue => ({
  from,
  to,
  spans,
  alignment: 2,
  position: null,
  margins: { left: 0, right: 0, vertical: 0 },
  isSign,
});

const CUES = [
  aCue(10, 12, [aSpan('Where are you going?')]),
  aCue(11, 14, [
    aSpan('Home', { isBold: true }),
    aSpan(', ', {}),
    aSpan('now', { isItalic: true }),
  ]),
  aCue(11, 13, [aSpan('EXIT')], true),
  aCue(20, 22, [aSpan('Later on')]),
];

describe('SubtitleLine', () => {
  it('draws nothing when no line is due', async () => {
    const drawn = await render(<SubtitleLine cues={CUES} position={5} isLifted={false} />);

    expect(drawn.toJSON()).toBeNull();
  });

  it('shows every line due at the moment, and none of the signs', async () => {
    const drawn = await render(<SubtitleLine cues={CUES} position={11.5} isLifted={false} />);

    expect(drawn.getByText('Where are you going?')).toBeTruthy();
    expect(drawn.getByText('Home, now')).toBeTruthy();
    expect(drawn.queryByText('EXIT')).toBeNull();
    expect(drawn.queryByText('Later on')).toBeNull();
  });

  it('shows a line from its start up to but not at its end', async () => {
    const atStart = await render(<SubtitleLine cues={CUES} position={20} isLifted={false} />);

    expect(atStart.getByText('Later on')).toBeTruthy();

    const atEnd = await render(<SubtitleLine cues={CUES} position={22} isLifted={false} />);

    expect(atEnd.queryByText('Later on')).toBeNull();
  });

  it('draws each part in the weight and slant the track gave it', async () => {
    const drawn = await render(<SubtitleLine cues={CUES} position={13} isLifted={false} />);

    expect(drawn.getByText('Home')).toHaveStyle({ fontWeight: '800' });
    expect(drawn.getByText('now')).toHaveStyle({ fontStyle: 'italic' });
    expect(drawn.getByText('now')).not.toHaveStyle({ fontWeight: '800' });
  });

  it('rises above the controls while they are showing', async () => {
    const low = await render(<SubtitleLine cues={CUES} position={20} isLifted={false} />);
    const lifted = await render(<SubtitleLine cues={CUES} position={20} isLifted />);
    const lineOf = (drawn: typeof low) => drawn.getByText('Later on').parent?.parent ?? null;

    expect(lineOf(low)).not.toHaveStyle({ bottom: 300 });
    expect(lineOf(lifted)).toHaveStyle({ bottom: 300 });
  });
});
