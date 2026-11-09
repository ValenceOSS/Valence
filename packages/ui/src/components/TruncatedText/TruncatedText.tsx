import { useLayoutEffect, useRef, useState } from 'react';
import { Tooltip } from '@ValenceUI/Tooltip';
import { cn } from '@ValenceUI/cn';
import type { TruncatedTextProps } from './TruncatedText.types';

/**
 * A line of text that ends in an ellipsis where it runs out of room, and then, and only then, says
 * the whole of itself in a tooltip — so nothing cut short is out of reach, and nothing that fits
 * gains a tooltip repeating what is already there. It measures itself again as its room changes.
 *
 * @param text - The words.
 * @param side - Which side of the text the tooltip opens on.
 * @param className - Classes for the text's look and layout.
 */
const TruncatedText = ({ text, side = 'top', className }: TruncatedTextProps) => {
  const line = useRef<HTMLSpanElement>(null);
  const [isCut, setIsCut] = useState(false);

  useLayoutEffect(() => {
    const element = line.current;

    if (element === null) {
      return undefined;
    }

    const measure = () => {
      setIsCut(element.scrollWidth > element.clientWidth);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const watching = new ResizeObserver(measure);

    watching.observe(element);

    return () => {
      watching.disconnect();
    };
  }, [text, isCut]);

  return (
    <Tooltip label={text} side={side} isDisabled={!isCut}>
      <span ref={line} className={cn('block min-w-0 truncate', className)}>
        {text}
      </span>
    </Tooltip>
  );
};

TruncatedText.displayName = 'TruncatedText';

export { TruncatedText };
