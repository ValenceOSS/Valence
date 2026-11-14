/**
 * Whether text is one magnet link and nothing besides: no space, line break or other control
 * character that a download client might read as a second address.
 *
 * @param text - What was given as a magnet link.
 * @returns Whether it is one.
 */
const isSingleMagnetLink = (text: string): boolean =>
  /^magnet:\?\S*$/.test(text) &&
  Array.from(text).every((each) => {
    const code = each.codePointAt(0) ?? 0;

    return code > 0x1f && code !== 0x7f;
  });

export { isSingleMagnetLink };
