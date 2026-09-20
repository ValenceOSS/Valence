import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { sizeOfBytes } from '@ValenceCore/functions/sizeOfBytes';
import type { AnimatedBytesProps } from './AnimatedBytes.types';

/**
 * A size that rolls to its new value, written the way every other size in Valence is — `1.4 GB`,
 * `356 MB` — with the number rolling and its unit standing still beside it.
 *
 * @param bytes - The size.
 * @param prefix - Text written straight before the number, such as an arrow.
 * @param suffix - Text written straight after the unit, such as ` free`.
 * @param className - Extra classes for the caller's own layout.
 */
const AnimatedBytes = ({ bytes, prefix, suffix = '', className }: AnimatedBytesProps) => {
  const { value, unit, decimals } = sizeOfBytes(bytes);

  return (
    <AnimatedNumber
      value={value}
      format={{ minimumFractionDigits: decimals, maximumFractionDigits: decimals }}
      suffix={` ${unit}${suffix}`}
      {...(prefix === undefined ? {} : { prefix })}
      {...(className === undefined ? {} : { className })}
    />
  );
};

AnimatedBytes.displayName = 'AnimatedBytes';

export { AnimatedBytes };
