const MOST_TAG_CHARACTERS = 4096;

type FoundTag = {
  name: string;
  isClosing: boolean;
  attributes: string;
  starts: number;
  ends: number;
};

/**
 * Walks a document's tags once, in order, passing over anything that opens a tag and never closes
 * it, so a document made of unclosed tags is read in time proportional to its length.
 *
 * @param text - The document.
 * @returns Each tag: its name in lower case, whether it closes an element, its attributes, and where
 *   it starts and where the text after it begins.
 */
function* tagsOf(text: string): Generator<FoundTag> {
  let from = 0;
  let tagEnds = -1;

  for (;;) {
    const opens = text.indexOf('<', from);

    if (opens === -1) {
      return;
    }

    if (tagEnds < opens) {
      tagEnds = text.indexOf('>', opens);
    }

    if (tagEnds === -1) {
      return;
    }

    const reopens = text.indexOf('<', opens + 1);

    if ((reopens !== -1 && reopens < tagEnds) || tagEnds - opens > MOST_TAG_CHARACTERS) {
      from = reopens === -1 ? tagEnds + 1 : Math.min(reopens, tagEnds + 1);
      continue;
    }

    const inside = text.slice(opens + 1, tagEnds);
    const isClosing = inside.startsWith('/');
    const named = /^[A-Za-z][\w:.-]*/u.exec(isClosing ? inside.slice(1) : inside);

    if (named !== null) {
      yield {
        name: named[0].toLowerCase(),
        isClosing,
        attributes: inside.slice((isClosing ? 1 : 0) + named[0].length),
        starts: opens,
        ends: tagEnds + 1,
      };
    }

    from = tagEnds + 1;
  }
}

export type { FoundTag };

export { tagsOf };
