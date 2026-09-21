declare module '*.mdx' {
  import type { ComponentType, ReactNode } from 'react';

  type MdxContentProps = { components?: Record<string, (props: never) => ReactNode> };

  const Content: ComponentType<MdxContentProps>;

  export default Content;
}
