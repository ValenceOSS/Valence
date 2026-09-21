import { useEffect, useRef } from 'react';
import { DOC_COMPONENTS } from '@ValenceDocs/components/DOC_COMPONENTS/DOC_COMPONENTS';
import { readHeadings } from '@ValenceDocs/components/DocPageView/components/DocContent/readHeadings';
import type { ComponentType } from 'react';
import type { DocContentProps } from '@ValenceDocs/content/DocPage.types';
import type { PageHeading } from '@ValenceDocs/components/DocPageView/components/DocContent/readHeadings';

type DocContentComponentProps = {
  Content: ComponentType<DocContentProps>;
  onHeadings: (headings: readonly PageHeading[]) => void;
};

/**
 * Renders a page's MDX with the site's components, and reports the headings it produced.
 *
 * @param Content - The compiled page.
 * @param onHeadings - Called with the page's headings once it is on screen.
 */
const DocContent = ({ Content, onHeadings }: DocContentComponentProps) => {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (root.current !== null) {
      onHeadings(readHeadings(root.current));
    }
  }, [Content, onHeadings]);

  return (
    <div ref={root}>
      <Content components={DOC_COMPONENTS} />
    </div>
  );
};

DocContent.displayName = 'DocContent';

export type { DocContentComponentProps };

export { DocContent };
