import type { HTMLAttributes } from 'react';

type DocHeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level: 2 | 3 | 4;
};

export type { DocHeadingProps };
