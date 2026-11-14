const MOST_TAG_CHARACTERS = 4096;

const MOST_ELEMENT_CHARACTERS = 65_536;

type FoundElement = { attributes: string; body: string };

/**
 * Walks a document once, in order, yielding each element of one name that is opened and closed
 * within reason.
 *
 * Every search resumes where the last one ended, so a document of openers that never close is read
 * in time proportional to its length, not to the square of it. An element whose opening tag or
 * contents are longer than any guide's is passed over rather than searched for further.
 *
 * @param text - The document.
 * @param name - The element's name, as the document writes it.
 * @returns Each element's opening-tag attributes and its contents.
 */
function* elementsOf(text: string, name: string): Generator<FoundElement> {
  const opener = `<${name}`;
  const closer = `</${name}>`;
  let from = 0;
  let tagEnds = -1;
  let closes = -1;

  for (;;) {
    const opens = text.indexOf(opener, from);

    if (opens === -1) {
      return;
    }

    const after = text[opens + opener.length] ?? '';

    if (!/[\s>/]/u.test(after)) {
      from = opens + opener.length;
      continue;
    }

    if (tagEnds < opens) {
      tagEnds = text.indexOf('>', opens);
    }

    if (tagEnds === -1) {
      return;
    }

    if (text[tagEnds - 1] === '/') {
      from = tagEnds + 1;
      continue;
    }

    if (closes < tagEnds) {
      closes = text.indexOf(closer, tagEnds);
    }

    if (closes === -1) {
      return;
    }

    const next = text.indexOf(opener, opens + opener.length);

    if (
      tagEnds - opens > MOST_TAG_CHARACTERS ||
      closes - tagEnds > MOST_ELEMENT_CHARACTERS ||
      (next !== -1 && next < closes)
    ) {
      from = opens + opener.length;
      continue;
    }

    yield {
      attributes: text.slice(opens + opener.length, tagEnds),
      body: text.slice(tagEnds + 1, closes),
    };
    from = closes + closer.length;
  }
}

export { elementsOf };
