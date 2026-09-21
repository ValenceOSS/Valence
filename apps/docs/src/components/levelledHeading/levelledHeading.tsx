import { DocHeading } from '@ValenceDocs/components/DocHeading/DocHeading';
import type { HTMLAttributes } from 'react';

/**
 * Makes the component a page uses for one heading tag, fixed to its level.
 *
 * @param level - Which heading it stands for.
 * @returns The component, named for its level.
 */
const levelledHeading = (level: 2 | 3 | 4) => {
  const Levelled = (props: HTMLAttributes<HTMLHeadingElement>) => (
    <DocHeading level={level} {...props} />
  );

  Levelled.displayName = `Doc.h${level.toString()}`;

  return Levelled;
};

export { levelledHeading };
