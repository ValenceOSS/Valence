const COUNTED_QUANTIFIER = /^\{(\d+)(?:(,)(\d*))?\}/;

type Quantifier = { length: number; repeats: boolean };

/**
 * Reads the quantifier that starts at a place in a pattern, if one does.
 *
 * @param pattern - The pattern.
 * @param at - Where to look.
 * @returns How long it is and whether it can repeat more than once, or null where there is none.
 */
const quantifierAt = (pattern: string, at: number): Quantifier | null => {
  const char = pattern[at];

  if (char === '*' || char === '+') {
    return { length: 1, repeats: true };
  }

  if (char !== '{') {
    return null;
  }

  const found = COUNTED_QUANTIFIER.exec(pattern.slice(at));

  if (found === null) {
    return null;
  }

  const [text, , comma, most] = found;

  return {
    length: text.length,
    repeats: comma !== undefined && (most === '' || Number(most) > 1),
  };
};

/**
 * Where a character class that opens at a place in a pattern ends.
 *
 * @param pattern - The pattern.
 * @param at - Where the class opens.
 * @returns The place just after its closing bracket, or the end of the pattern.
 */
const afterClass = (pattern: string, at: number): number => {
  let place = at + 1;

  while (place < pattern.length) {
    if (pattern[place] === '\\') {
      place += 2;
    } else if (pattern[place] === ']') {
      return place + 1;
    } else {
      place += 1;
    }
  }

  return pattern.length;
};

/**
 * Whether a pattern repeats a group whose body can itself repeat or choose, which a regular
 * expression engine can take for ever to fail.
 *
 * @param pattern - The pattern, without its slashes.
 * @returns Whether it does.
 */
const repeatsARepeat = (pattern: string): boolean => {
  const groups: boolean[] = [];
  const markOuter = (): void => {
    if (groups.length > 0) {
      groups[groups.length - 1] = true;
    }
  };
  let at = 0;

  while (at < pattern.length) {
    const char = pattern[at];

    if (char === '\\') {
      at += 2;
    } else if (char === '[') {
      at = afterClass(pattern, at);
    } else if (char === '(') {
      groups.push(false);
      at += 1;
    } else if (char === '|') {
      markOuter();
      at += 1;
    } else if (char === ')') {
      const varies = groups.pop() === true;
      const after = quantifierAt(pattern, at + 1);

      if (varies && after?.repeats === true) {
        return true;
      }

      if (varies || after?.repeats === true) {
        markOuter();
      }

      at += 1 + (after?.length ?? 0);
    } else {
      const quantifier = quantifierAt(pattern, at);

      if (quantifier?.repeats === true) {
        markOuter();
      }

      at += quantifier?.length ?? 1;
    }
  }

  return false;
};

export { repeatsARepeat };
