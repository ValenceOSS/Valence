import { Link } from '@ValenceUI/Link';
import type { HowToFixProps } from './HowToFix.types';

/**
 * A link to the section of the documentation that explains a problem and how to put it right, or
 * nothing where no section does.
 *
 * @param href - Where the docs explain the problem, or nothing.
 */
const HowToFix = ({ href }: HowToFixProps) =>
  href === null || href === undefined ? null : (
    <Link href={href} className="text-xs">
      How to fix this
    </Link>
  );

HowToFix.displayName = 'HowToFix';

export { HowToFix };
