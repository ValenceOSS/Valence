import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const GAPS = /(\{\w+\})/u;

const GAP = /^\{(\w+)\}$/u;

/**
 * Says words from the strings file with something drawn, such as an animated figure, standing in
 * each `{name}` gap, so the words keep the order the language puts them in.
 *
 * @param key - Which words.
 * @param parts - What to draw in each gap, by the gap's name.
 * @returns The words, with the parts in place.
 */
const sayInParts = (key: StringKey, parts: Readonly<Record<string, ReactNode>>): ReactNode =>
  say(key)
    .split(GAPS)
    .map((piece, index) => {
      const name = GAP.exec(piece)?.[1];

      return (
        <Fragment key={`${index.toString()}-${piece}`}>
          {name !== undefined && name in parts ? parts[name] : piece}
        </Fragment>
      );
    });

export { sayInParts };
