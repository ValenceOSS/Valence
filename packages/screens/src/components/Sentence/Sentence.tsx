import { Fragment } from 'react';
import { sayCountParts } from '@ValenceI18n/sayCountParts';
import { sayParts } from '@ValenceI18n/sayParts';
import type { SentenceProps } from './Sentence.types';

/**
 * A sentence from the strings file with something other than words in its gaps, such as a link
 * or a rolling number, put where the language puts it rather than where the English does. Given a
 * count, it is said in the form the language uses for that many.
 *
 * @param props - Which sentence, what goes in each gap, and how many where it counts something.
 */
const Sentence = (props: SentenceProps) => (
  <>
    {('counted' in props
      ? sayCountParts(props.counted, props.count, props.fillings)
      : sayParts(props.words, props.fillings)
    ).map((part, at) => (
      <Fragment key={at.toString()}>{part}</Fragment>
    ))}
  </>
);

Sentence.displayName = 'Sentence';

export { Sentence };
