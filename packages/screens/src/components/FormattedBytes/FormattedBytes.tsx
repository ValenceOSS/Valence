import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { sizeOfBytes } from '@ValenceCore/functions/sizeOfBytes';
import type { FormattedBytesProps } from './FormattedBytes.types';

/**
 * A size written the way every other size in Valence is — `1.4 GB`, `356 MB` — with its digits set
 * to one width, so a size that updates does not shift the words around it.
 *
 * @param bytes - The size.
 * @param prefix - Text written straight before the number, such as an arrow.
 * @param suffix - Text written straight after the unit, such as ` free`.
 * @param className - Extra classes for the caller's own layout.
 */
const FormattedBytes = ({ bytes, prefix, suffix = '', className }: FormattedBytesProps) => {
  const { value, unit, decimals } = sizeOfBytes(bytes);

  return (
    <FormattedNumber
      value={value}
      format={{ minimumFractionDigits: decimals, maximumFractionDigits: decimals }}
      suffix={` ${unit}${suffix}`}
      {...(prefix === undefined ? {} : { prefix })}
      {...(className === undefined ? {} : { className })}
    />
  );
};

FormattedBytes.displayName = 'FormattedBytes';

export { FormattedBytes };
