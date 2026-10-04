import { cn } from '@ValenceUI/cn';
import type { FormattedNumberProps } from './FormattedNumber.types';

/**
 * A number written in the reader's own way, with its digits set to one width so a figure that
 * updates does not shift the words around it.
 *
 * @param value - The number.
 * @param format - How to write it, as `Intl.NumberFormat` takes it.
 * @param prefix - Anything written straight before it.
 * @param suffix - Anything written straight after it.
 * @param className - Extra classes for the caller's own layout.
 */
const FormattedNumber = ({ value, format, prefix, suffix, className }: FormattedNumberProps) => (
  <span className={cn('tabular-nums', className)}>
    {`${prefix ?? ''}${new Intl.NumberFormat(undefined, format).format(value)}${suffix ?? ''}`}
  </span>
);

FormattedNumber.displayName = 'FormattedNumber';

export { FormattedNumber };
