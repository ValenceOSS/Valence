const SCRIPT_RANGES: Readonly<Record<string, string>> = {
  IsCyrillic: '\\u0400-\\u04FF',
  IsCyrillicSupplement: '\\u0500-\\u052F',
  IsGreek: '\\u0370-\\u03FF',
  IsArabic: '\\u0600-\\u06FF',
  IsHebrew: '\\u0590-\\u05FF',
  IsThai: '\\u0E00-\\u0E7F',
  IsBasicLatin: '\\u0000-\\u007F',
  IsLatin1Supplement: '\\u0080-\\u00FF',
  IsCJKUnifiedIdeographs: '\\u4E00-\\u9FFF',
  IsHiragana: '\\u3040-\\u309F',
  IsKatakana: '\\u30A0-\\u30FF',
  IsHangulSyllables: '\\uAC00-\\uD7AF',
};

/**
 * Turns a regular expression written for .NET, which is what definitions are written against, into
 * one JavaScript runs the same way.
 *
 * Three differences matter in practice. An inline `(?i)` becomes the `i` flag. A named Unicode block
 * such as `\p{IsCyrillic}` becomes its range, inside a class where it already was one and wrapped in
 * one where it was not. And `$0` in a replacement, the whole match, becomes `$&`. Anything else .NET
 * alone understands, such as balancing groups, is left for the caller to find out about.
 *
 * @param pattern - The pattern as a definition wrote it.
 * @param isGlobal - Whether to replace every match rather than the first.
 * @returns The expression.
 * @throws SyntaxError where the pattern is not one JavaScript can run.
 */
const translateRegex = (pattern: string, isGlobal = false): RegExp => {
  const isCaseless = /\(\?i\)/.test(pattern);
  let inClass = false;
  let source = '';

  for (let at = 0; at < pattern.length; at += 1) {
    const character = pattern[at] ?? '';

    if (character === '\\') {
      const block = /^\\[pP]\{(Is\w+)\}/.exec(pattern.slice(at))?.[1];
      const range = block === undefined ? undefined : SCRIPT_RANGES[block];

      if (block !== undefined && range !== undefined) {
        source += inClass ? range : `[${range}]`;
        at += block.length + 3;
      } else {
        source += pattern.slice(at, at + 2);
        at += 1;
      }

      continue;
    }

    if (character === '[' && !inClass) {
      inClass = true;
    } else if (character === ']' && inClass) {
      inClass = false;
    }

    source += character;
  }

  return new RegExp(
    source.replaceAll('(?i)', ''),
    `${isCaseless ? 'i' : ''}${isGlobal ? 'g' : ''}`,
  );
};

export { translateRegex };
