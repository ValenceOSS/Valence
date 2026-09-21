import { createElement } from 'react';
import { cn } from '@ValenceUI/cn';
import type { HTMLAttributes, ReactElement } from 'react';

/**
 * Makes a component that renders one HTML element with the site's classes.
 *
 * For the elements a page uses that need styling and nothing else, so a paragraph or a list item is
 * declared by its tag and its classes here instead of being a component file of its own.
 *
 * @param tag - The element to render.
 * @param classes - What to style it with.
 * @returns The component, named for the element.
 */
const styleElement = (
  tag: string,
  classes: string,
): ((props: HTMLAttributes<HTMLElement>) => ReactElement) & { displayName: string } => {
  const Styled = ({ className, ...rest }: HTMLAttributes<HTMLElement>) =>
    createElement(tag, { ...rest, className: cn(classes, className) });

  Styled.displayName = `Doc.${tag}`;

  return Styled;
};

export { styleElement };
