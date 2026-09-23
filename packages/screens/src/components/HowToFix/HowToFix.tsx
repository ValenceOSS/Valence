import { Button } from '@ValenceUI/Button';
import type { HowToFixProps } from './HowToFix.types';

/**
 * A link to the section of the documentation that explains a problem and how to put it right, or
 * nothing where no section does.
 *
 * @param href - Where the docs explain the problem, or nothing.
 */
const HowToFix = ({ href }: HowToFixProps) =>
  href === null || href === undefined ? null : (
    <Button
      variant="link"
      size="none"
      hasTooltip={false}
      className="text-xs"
      onClick={() => {
        window.open(href, '_blank', 'noopener,noreferrer');
      }}
    >
      How to fix this
    </Button>
  );

HowToFix.displayName = 'HowToFix';

export { HowToFix };
