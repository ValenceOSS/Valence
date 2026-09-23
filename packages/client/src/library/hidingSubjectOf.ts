import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type Hiding = {
  kind: 'item' | 'series';
  subjectId: string;
  title: string;
};

/**
 * What hiding something actually means, given the thing somebody pressed hide on.
 *
 * An episode is almost never what anybody means. A card standing for a programme is one of its
 * episodes wearing the programme's name, so hiding it as an item would take that episode away and
 * leave the programme exactly where it was, wearing a different episode instead. Nobody pressing
 * hide on a show wants the show to still be there.
 *
 * So anything belonging to a programme hides the programme, and the name that comes back is the
 * programme's — which is also what the question put to somebody has to say, since agreeing to hide
 * one thing and losing another is worse than not asking at all.
 *
 * @param media - What they pressed hide on.
 * @returns What to hide, and what to call it when asking.
 */
const hidingSubjectOf = (
  media: Pick<MediaSummary, 'id' | 'title' | 'seriesId' | 'seriesTitle'>,
): Hiding => {
  const seriesId = media.seriesId ?? null;

  if (seriesId === null) {
    return { kind: 'item', subjectId: media.id, title: media.title };
  }

  return {
    kind: 'series',
    subjectId: seriesId,
    title: media.seriesTitle ?? media.title,
  };
};

export type { Hiding };

export { hidingSubjectOf };
