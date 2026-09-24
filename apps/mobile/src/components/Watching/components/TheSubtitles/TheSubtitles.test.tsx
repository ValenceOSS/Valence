import { render } from '@testing-library/react-native';
import { TheSubtitles } from './TheSubtitles';
import type { SubtitleCue, SubtitleSpan } from '@ValenceClient/playback/fetchSubtitleCues';

const aSpan = (text: string, colour: string | null = null): SubtitleSpan => ({
  text,
  colour,
  fontFamily: null,
  fontHeight: null,
  opacity: null,
  isBold: false,
  isItalic: false,
  isUnderlined: false,
  isStruckThrough: false,
});

const aCue = (
  from: number,
  to: number,
  text: string,
  colour: string | null = null,
): SubtitleCue => ({
  from,
  to,
  spans: [aSpan(text, colour)],
  alignment: 2,
  position: null,
  margins: { left: 0, right: 0, vertical: 0 },
  isSign: false,
});

describe('TheSubtitles', () => {
  it('draws the line being spoken', async () => {
    const drawn = await render(
      <TheSubtitles
        cues={[aCue(0, 4, 'Hello there')]}
        atSeconds={2}
        isClearOfTheControls={false}
      />,
    );

    expect(drawn.getByText('Hello there')).toBeTruthy();
  });

  it('draws nothing in a silence', async () => {
    const drawn = await render(
      <TheSubtitles
        cues={[aCue(0, 4, 'Hello there')]}
        atSeconds={9}
        isClearOfTheControls={false}
      />,
    );

    expect(drawn.queryByText('Hello there')).toBeNull();
  });

  it('draws every line showing at once, since a sign can sit over speech', async () => {
    const drawn = await render(
      <TheSubtitles
        cues={[aCue(0, 4, 'Speaking'), aCue(1, 3, 'A sign')]}
        atSeconds={2}
        isClearOfTheControls={false}
      />,
    );

    expect(drawn.getByText('Speaking')).toBeTruthy();
    expect(drawn.getByText('A sign')).toBeTruthy();
  });

  it('joins the pieces of a line that changed colour part way through', async () => {
    const two = aCue(0, 4, 'One ');

    two.spans.push(aSpan('two'));

    const drawn = await render(
      <TheSubtitles cues={[two]} atSeconds={2} isClearOfTheControls={false} />,
    );

    expect(drawn.getByText('One two')).toBeTruthy();
  });

  it('never takes a touch meant for the film behind it', async () => {
    const drawn = await render(
      <TheSubtitles
        cues={[aCue(0, 4, 'Hello there')]}
        atSeconds={2}
        isClearOfTheControls={false}
      />,
    );

    expect(drawn.getByText('Hello there')).toBeTruthy();
    expect(drawn.queryByRole('button')).toBeNull();
  });

  it('draws nothing at all for a track with nothing in it', async () => {
    const drawn = await render(
      <TheSubtitles cues={[]} atSeconds={2} isClearOfTheControls={false} />,
    );

    expect(drawn.toJSON()).toBeNull();
  });
});
