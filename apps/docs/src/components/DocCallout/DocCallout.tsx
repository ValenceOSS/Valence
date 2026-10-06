import { Callout } from '@ValenceUI/Callout';
import type { CalloutProps } from '@ValenceUI/Callout.types';

/**
 * A note or warning set into a page, as ValenceUI's callout, spaced for reading in the middle of a
 * page with the paragraphs inside it close together.
 *
 * @param props - What the callout says, and how loudly.
 */
const DocCallout = (props: CalloutProps) => (
  <Callout
    {...props}
    className="my-6 text-[0.9375rem] [&_p]:my-1.5 [&_p]:text-[0.9375rem] [&_p]:leading-relaxed"
  />
);

DocCallout.displayName = 'DocCallout';

export { DocCallout };
