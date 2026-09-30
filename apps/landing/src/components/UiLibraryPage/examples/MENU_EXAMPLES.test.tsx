import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MENU_EXAMPLES } from './MENU_EXAMPLES';

describe('MENU_EXAMPLES', () => {
  it.each(
    Object.entries(MENU_EXAMPLES).flatMap(([name, examples]) =>
      examples.map((example): [string, typeof example] => [`${name}: ${example.title}`, example]),
    ),
  )('draws %s', (_, example) => {
    const { container } = render(<>{example.render()}</>);

    expect(container).not.toBeEmptyDOMElement();
  });
});
