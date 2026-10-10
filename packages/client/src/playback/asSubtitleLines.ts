import { parseWebVtt } from '@ValenceClient/playback/parseWebVtt';
import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';

const PLAIN_MARGINS = { left: 0, right: 0, vertical: 0 };

const BOTTOM_CENTRE = 2;

const LEFTOVER_BLOCK = /\{[^}]*\}/g;

/**
 * Reads a WebVTT file as lines of the same shape a script produces, so that whatever draws them need
 * not know which kind of file they came from.
 *
 * Nothing in WebVTT is a sign: the format carries no styling Valence reads, and a positioning hint
 * is deliberately ignored — where a line sits depends on whether the controls are up, which the file
 * cannot know and the player does.
 *
 * Braced blocks a conversion from another format left in the text — `{\an8}`, or a stray `{=20}` —
 * are taken out, since they were instructions to something that is no longer reading them.
 *
 * @param text - The file.
 * @returns Its lines, dressed in nothing.
 */
const asSubtitleLines = (text: string): SubtitleCue[] =>
  parseWebVtt(text).map((cue) => ({
    from: cue.from,
    to: cue.to,
    spans: [
      {
        text: cue.text.replaceAll(LEFTOVER_BLOCK, ''),
        fontFamily: null,
        fontHeight: null,
        colour: null,
        opacity: null,
        isBold: false,
        isItalic: false,
        isUnderlined: false,
        isStruckThrough: false,
      },
    ],
    alignment: BOTTOM_CENTRE,
    position: null,
    margins: PLAIN_MARGINS,
    isSign: false,
  }));

export { asSubtitleLines };
