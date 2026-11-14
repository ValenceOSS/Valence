import { cornerOf } from '@ValenceClient/playback/cornerOf';
import type { CueCorner } from '@ValenceClient/playback/cornerOf';
import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';

type SubtitleRow = CueCorner['down'];

type ArrangedLines = {
  rows: Record<SubtitleRow, SubtitleCue[]>;
  placed: SubtitleCue[];
};

/**
 * Sorts the lines on screen at a moment into where they are drawn, so that no two land on the same
 * spot: a line the script put at a point of its own goes there, and every other line joins the row
 * its alignment names — the foot, the middle or the top of the picture — stacked in the order the
 * script wrote them.
 *
 * A script often writes one line several times over at the same moment, a layer for the outline and
 * one for the fill, which a renderer of the script lays exactly on top of each other. Drawn here they
 * would be the same words twice, so only one is kept: the last, which is the one drawn on top, and so
 * the fill rather than its glow.
 *
 * @param showing - The lines on screen at the moment, in the order the script has them.
 * @returns The lines by row, and the lines placed at a point of their own.
 */
const arrangeSubtitleLines = (showing: readonly SubtitleCue[]): ArrangedLines => {
  const kept = new Map<string, SubtitleCue>();
  const arranged: ArrangedLines = { rows: { top: [], middle: [], bottom: [] }, placed: [] };

  for (const cue of showing) {
    const said = cue.spans.map((span) => span.text).join('');

    if (said.trim() !== '') {
      kept.set([cue.from, cue.to, cue.position?.x, cue.position?.y, said].join('\u0000'), cue);
    }
  }

  for (const cue of kept.values()) {
    if (cue.position !== null) {
      arranged.placed.push(cue);
    } else {
      arranged.rows[cornerOf(cue.alignment).down].push(cue);
    }
  }

  return arranged;
};

export type { ArrangedLines, SubtitleRow };

export { arrangeSubtitleLines };
