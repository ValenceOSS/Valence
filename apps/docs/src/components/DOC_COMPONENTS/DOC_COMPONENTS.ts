import { Callout } from '@ValenceUI/Callout';
import { DocCode } from '@ValenceDocs/components/DocCode/DocCode';
import { DocImage } from '@ValenceDocs/components/DocImage/DocImage';
import { DocInlineCode } from '@ValenceDocs/components/DocInlineCode/DocInlineCode';
import { DocLink } from '@ValenceDocs/components/DocLink/DocLink';
import { DocTable } from '@ValenceDocs/components/DocTable/DocTable';
import { levelledHeading } from '@ValenceDocs/components/levelledHeading/levelledHeading';
import { styleElement } from '@ValenceDocs/components/styleElement/styleElement';

const DOC_COMPONENTS = {
  h2: levelledHeading(2),
  h3: levelledHeading(3),
  h4: levelledHeading(4),
  p: styleElement('p', 'my-4 text-base leading-7 text-text-muted'),
  ul: styleElement('ul', 'my-4 list-disc space-y-2 pl-6 text-text-muted marker:text-text-muted/60'),
  ol: styleElement('ol', 'my-4 list-decimal space-y-2 pl-6 text-text-muted marker:font-medium'),
  li: styleElement('li', 'pl-1 leading-7'),
  strong: styleElement('strong', 'font-semibold text-text'),
  blockquote: styleElement(
    'blockquote',
    'my-6 border-l-2 border-accent/50 pl-4 text-text-muted italic',
  ),
  hr: styleElement('hr', 'my-10 border-border'),
  thead: styleElement('thead', 'bg-surface-raised text-text'),
  tr: styleElement('tr', 'border-b border-border last:border-0'),
  th: styleElement('th', 'whitespace-nowrap px-4 py-2.5 font-semibold'),
  td: styleElement('td', 'px-4 py-2.5 align-top text-text-muted'),
  a: DocLink,
  pre: DocCode,
  code: DocInlineCode,
  img: DocImage,
  table: DocTable,
  Callout,
};

export { DOC_COMPONENTS };
